
import React, { useState } from 'react';
import Image from 'next/image';
import { fileToDataUrl } from '@/Providers/AlagaLink/assets';

interface ImageInputProps {
  value: string;
  onChange: (newValue: string) => void;
  label?: string;
  aspect?: 'square' | 'video';
}

const ImageInput: React.FC<ImageInputProps> = ({
  value,
  onChange,
  label = "Asset Image",
  aspect = 'square'
}) => {
  const [mode, setMode] = useState<'URL' | 'Upload'>('URL');
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState<string>(value || '');
  const [isTesting, setIsTesting] = useState(false);
  const [imageError, setImageError] = useState<string>('');

  // Keep local input in sync with prop value
  React.useEffect(() => { setUrlInput(value || ''); setImageError(''); }, [value]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const dataUrl = await fileToDataUrl(file);
      onChange(dataUrl);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      const dataUrl = await fileToDataUrl(file);
      onChange(dataUrl);
    }
  };

  // Transform facebook profile/page URLs into direct graph picture endpoints
  const transformFacebookUrl = (raw: string) => {
    try {
      const u = new URL(raw);
      if (!u.hostname.includes('facebook.com')) return raw;
      // Example: https://www.facebook.com/username or profile.php?id=12345
      if (u.pathname.includes('profile.php')) {
        const id = u.searchParams.get('id');
        if (id) return `https://graph.facebook.com/${id}/picture?type=large`;
      }
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        const candidate = parts[0];
        return `https://graph.facebook.com/${candidate}/picture?type=large`;
      }
      return raw;
    } catch {
      return raw;
    }
  };

  const testImageUrl = async (testUrl: string) => {
    setIsTesting(true);
    setImageError('');

    // If we're testing our own proxy endpoint, prefer a HEAD request to validate content-type quickly
    try {
      if (testUrl.startsWith('/api/')) {
        const r = await fetch(testUrl, { method: 'HEAD' });
        const ct = r.headers.get('content-type') || '';
        const ok = r.ok && ct.startsWith('image/');
        if (!ok) {
          setIsTesting(false);
          setImageError('Proxy responded but did not return an image.');
          return false;
        }
        setIsTesting(false);
        setImageError('');
        return true;
      }
    } catch {
      // head request failed, fall back to image test
    }

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      let img: any;
      try {
        img = new (window as any).Image();
      } catch {
        img = document.createElement('img');
      }
      img.crossOrigin = 'anonymous';
      img.onload = () => { if (!settled) { settled = true; setIsTesting(false); setImageError(''); resolve(true); } };
      img.onerror = () => { if (!settled) { settled = true; setIsTesting(false); setImageError('Unable to load image from the provided URL (CORS or invalid asset).'); resolve(false); } };
      img.src = testUrl;
      // Fail-safe timeout
      setTimeout(() => { if (!settled) { settled = true; setIsTesting(false); setImageError('Image load timed out'); resolve(false); } }, 6000);
    });
  };

  const applyUrl = async () => {
    if (!urlInput) return;
    setImageError('');
    // if it's a facebook URL, attempt to transform it
    let resolved = urlInput.trim();
    if (resolved.includes('facebook.com') && !resolved.includes('/picture')) resolved = transformFacebookUrl(resolved);

    const ok = await testImageUrl(resolved);
    if (ok) {
      onChange(resolved);
      return;
    }

    // If direct test failed, try using the server-side proxy to avoid CORS/private host issues
    try {
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(resolved)}`;
      const proxyOk = await testImageUrl(proxyUrl);
      if (proxyOk) {
        onChange(proxyUrl);
        setImageError('');
        return;
      }
    } catch {
      // fallthrough to error below
    }

    // still set the resolved value but surface an error so user can choose another image
    onChange(resolved);
    setImageError('Unable to fetch image directly. A proxy attempt was made and failed. Consider using a public CDN or upload the file.');
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">{label}</label>
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
           <button
            type="button"
            onClick={() => setMode('URL')}
            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${mode === 'URL' ? 'bg-white dark:bg-alaga-charcoal text-alaga-blue shadow-sm' : 'opacity-40'}`}
           >URL</button>
           <button
            type="button"
            onClick={() => setMode('Upload')}
            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${mode === 'Upload' ? 'bg-white dark:bg-alaga-charcoal text-alaga-blue shadow-sm' : 'opacity-40'}`}
           >Local Upload</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Preview Card */}
        <div className="md:col-span-1">
          <div className={`relative group overflow-hidden rounded-2xl border-4 border-white dark:border-white/5 shadow-xl bg-gray-100 dark:bg-alaga-navy/40 ${aspect === 'square' ? 'aspect-square' : 'aspect-video'}`}>
             {value ? (
               <Image src={value} alt="Preview" width={600} height={400} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center opacity-20 p-4 text-center">
                 <i className="fa-solid fa-image text-3xl mb-2"></i>
                 <p className="text-[8px] font-black uppercase tracking-widest leading-tight">No Preview Available</p>
               </div>
             )}
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <span className="text-[8px] font-black uppercase text-white tracking-widest">Asset Preview</span>
             </div>
          </div>
        </div>

        {/* Input Card */}
        <div className="md:col-span-2">
           {mode === 'URL' ? (
             <div className="h-full flex flex-col justify-center space-y-3">
               <div className="relative group">
                 <i className="fa-solid fa-link absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-xs"></i>
                 <input
                   type="text"
                   value={urlInput}
                   onChange={e => setUrlInput(e.target.value)}
                   onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyUrl(); } }}
                   placeholder="Enter high-res image URL..."
                   className="w-full pl-10 pr-28 py-4 rounded-xl bg-alaga-gray dark:bg-alaga-navy/20 border-2 border-transparent focus:border-alaga-blue/30 outline-none font-bold text-sm transition-all shadow-inner"
                 />
                 <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                   <button type="button" onClick={applyUrl} className={`px-3 py-2 rounded-lg text-xs font-black uppercase bg-white dark:bg-alaga-charcoal`}>Apply</button>
                   <button type="button" onClick={() => { applyUrl(); }} className={`px-3 py-2 rounded-lg text-xs font-black uppercase ${isTesting ? 'opacity-60 cursor-not-allowed' : 'bg-white dark:bg-alaga-charcoal'}`}>{isTesting ? 'Testing...' : 'Test'}</button>
                 </div>
               </div>
               {imageError && <p className="text-[9px] font-medium text-red-500">{imageError}</p>}
               <p className="text-[9px] font-medium opacity-40 italic">Tip: Use Unsplash, stable CDN, or paste a Facebook profile link — the system will try to resolve the profile picture.</p>
             </div>
           ) : (
             <div className="h-full">
               <label
                 className={`h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition-all cursor-pointer ${isDragging ? 'border-alaga-blue bg-alaga-blue/5 scale-[0.98]' : 'border-gray-200 dark:border-white/10 hover:bg-alaga-blue/5'}`}
                 onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                 onDragLeave={() => setIsDragging(false)}
                 onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleDrop(e); }}
               >
                 <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                 <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center transition-all ${isDragging ? 'bg-alaga-blue text-white' : 'bg-alaga-blue/10 text-alaga-blue'}`}>
                    <i className={`fa-solid ${isDragging ? 'fa-arrow-down' : 'fa-cloud-arrow-up'} text-lg`}></i>
                 </div>
                 <p className="text-xs font-black uppercase tracking-widest text-center">Drop file here or click</p>
                 <p className="text-[9px] opacity-40 mt-1 font-bold">Local Directory Simulation</p>
               </label>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ImageInput;
