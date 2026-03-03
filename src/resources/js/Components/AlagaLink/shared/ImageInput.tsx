
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
  const [isDragging, setIsDragging] = useState(false);


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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">{label}</label>
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
        </div>
      </div>
    </div>
  );
};

export default ImageInput;
