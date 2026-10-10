import React, { useRef, useState } from 'react';
import { useSolarStore } from '../../../store/solarStore';
import { Upload, X, Image as ImageIcon, Sun } from 'lucide-react';

export default function ImageUploadStep() {
  const { siteInput, updateSiteInput } = useSolarStore();
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(siteInput.image ? URL.createObjectURL(siteInput.image) : null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file && file.type.match('image.*')) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      updateSiteInput({ image: file });
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    updateSiteInput({ image: undefined });
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
          <Upload className="w-8 h-8 text-amber-400 mr-3" />
          Analyze Your Roof
        </h2>
        <p className="text-slate-400">Upload your rooftop satellite image for AI analysis to estimate available space.</p>
      </div>

      {!preview ? (
        <div
          className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl transition-all ${
            dragActive ? 'border-amber-400 bg-amber-400/10' : 'border-slate-600 bg-slate-900/50 hover:bg-slate-800'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg, image/png, image/webp"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
          />
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-amber-400 shadow-lg">
              <Upload className="w-8 h-8" />
            </div>
            <p className="mb-2 text-lg text-slate-300 font-semibold">
              <span className="text-amber-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-slate-500">JPG, PNG or WebP (Max. 10MB)</p>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-64 rounded-3xl overflow-hidden border border-white/20 group">
          <img src={preview} alt="Roof preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-6">
            <div className="flex items-center text-white">
              <ImageIcon className="w-5 h-5 mr-2 text-amber-400" />
              <span className="font-medium truncate max-w-[200px]">{siteInput.image?.name}</span>
            </div>
            <button
              onClick={removeImage}
              className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-4 flex items-start">
         <div className="bg-amber-400/20 p-2 rounded-full mr-3 text-amber-400 mt-0.5">
           <Sun className="w-4 h-4" />
         </div>
         <div>
           <h4 className="text-amber-400 font-medium text-sm">Why do we need this?</h4>
           <p className="text-slate-400 text-sm mt-1">Our AI analyzes your roof's shape and shading to calculate the exact number of panels you can install for maximum efficiency.</p>
         </div>
      </div>
    </div>
  );
}
