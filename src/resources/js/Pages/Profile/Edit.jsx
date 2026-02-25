import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status, stats }) {
    const user = usePage().props.auth.user;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Profile</h2>}>
            <Head title="Profile" />

            <div className="py-10">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
                        <p className="mt-1 text-sm text-gray-600">{user?.email}</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-lg border border-gray-200 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Account Age</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">{stats?.accountAgeDays ?? 0} days</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Email Verification</p>
                                <p className="mt-1 text-2xl font-bold text-gray-900">
                                    {stats?.emailVerified ? 'Verified' : 'Pending'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
