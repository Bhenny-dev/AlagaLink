<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'alagalink_id',
        'alagalink_role',
        'alagalink_status',
        'alagalink_data',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'alagalink_data' => 'array',
        ];
    }

    /**
     * Ensure an issued PWD ID metadata exists for this profile.
     *
     * This is only applicable for role=User and status=Active.
     */
    public function ensurePwdIdMetadata(?self $issuedBy = null): bool
    {
        $data = is_array($this->alagalink_data) ? $this->alagalink_data : [];

        $status = (string) ($this->alagalink_status ?: data_get($data, 'status', 'Pending'));
        $role = (string) ($this->alagalink_role ?: data_get($data, 'role', 'User'));

        if ($role !== 'User' || $status !== 'Active') {
            return false;
        }

        $existingIdNumber = data_get($data, 'idMetadata.idNumber');
        if (is_string($existingIdNumber) && trim($existingIdNumber) !== '') {
            return false;
        }

        $existingMax = 0;
        $usedNumbers = [];

        // Small dataset assumption: scan existing records to keep issuance unique and monotonic.
        self::query()
            ->whereNotNull('alagalink_data')
            ->get(['alagalink_data'])
            ->each(function (self $u) use (&$existingMax, &$usedNumbers) {
                $uData = is_array($u->alagalink_data) ? $u->alagalink_data : [];
                $idNumber = data_get($uData, 'idMetadata.idNumber');
                if (!is_string($idNumber) || trim($idNumber) === '') {
                    return;
                }

                $usedNumbers[$idNumber] = true;

                if (preg_match('/(\d+)\s*$/', $idNumber, $m) === 1) {
                    $existingMax = max($existingMax, (int) $m[1]);
                }
            });

        $yearBase = ((int) now()->format('Y')) * 1000;
        $nextNumeric = max($existingMax + 1, $yearBase + 1);

        // Avoid unlikely collisions (e.g. concurrent approvals).
        $idNumber = null;
        for ($i = 0; $i < 10; $i++) {
            $candidate = 'CAR-BEN-LT-'.($nextNumeric + $i);
            if (!isset($usedNumbers[$candidate])) {
                $idNumber = $candidate;
                break;
            }
        }
        if ($idNumber === null) {
            $idNumber = 'CAR-BEN-LT-'.$nextNumeric.'-'.str()->upper(str()->random(4));
        }

        $now = now();
        $baseUrl = rtrim((string) config('app.url', ''), '/');
        if ($baseUrl === '') {
            $baseUrl = 'https://alagalink.ph';
        }

        $issuingOfficer = (string) ($issuedBy?->name ?: 'ALAGALINK SYSTEM');
        if ($issuingOfficer !== '') {
            $issuingOfficer = mb_strtoupper($issuingOfficer);
        }

        $data['role'] = $data['role'] ?? $role;
        $data['status'] = $data['status'] ?? $status;
        $data['idMetadata'] = [
            'idNumber' => $idNumber,
            'issuedDate' => $now->toDateString(),
            'expiryDate' => $now->copy()->addYears(5)->toDateString(),
            'issuingOfficer' => $issuingOfficer,
            'issuingOffice' => 'PDAO La Trinidad',
            'causeOfDisability' => (string) data_get($data, 'customData.causeOfDisability', 'N/A'),
            'qrCodeValue' => $baseUrl.'/verify/'.rawurlencode($idNumber),
        ];

        $this->forceFill([
            'alagalink_data' => $data,
        ])->save();

        return true;
    }

    /**
     * Retract the issued PWD ID metadata from the profile data.
     *
     * Used when a user's status changes away from Active.
     */
    public function retractPwdIdMetadata(): bool
    {
        $data = is_array($this->alagalink_data) ? $this->alagalink_data : [];
        $existingIdNumber = data_get($data, 'idMetadata.idNumber');
        if (!is_string($existingIdNumber) || trim($existingIdNumber) === '') {
            if (!array_key_exists('idMetadata', $data)) {
                return false;
            }
        }

        unset($data['idMetadata']);

        $this->forceFill([
            'alagalink_data' => $data,
        ])->save();

        return true;
    }

    /**
     * Keep PWD ID metadata in sync with eligibility.
     */
    public function syncPwdIdMetadata(?self $issuedBy = null): void
    {
        $data = is_array($this->alagalink_data) ? $this->alagalink_data : [];
        $status = (string) ($this->alagalink_status ?: data_get($data, 'status', 'Pending'));
        $role = (string) ($this->alagalink_role ?: data_get($data, 'role', 'User'));

        if ($role === 'User' && $status === 'Active') {
            $this->ensurePwdIdMetadata($issuedBy);

            return;
        }

        $this->retractPwdIdMetadata();
    }
}
