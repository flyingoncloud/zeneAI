'use client';

import { useState, useEffect } from 'react';

interface ImageGalleryProps {
  open: boolean;
  onClose: () => void;
  onImageSelect?: ((imageUrl: string) => void) | null;
}

interface GalleryItem {
  id: string;
  url: string;
}

export default function ImageGallery({ open, onClose, onImageSelect }: ImageGalleryProps) {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);

  useEffect(() => {
    if (open) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/zene/gallery`)
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            const items = data.items || [];
            const repeated = Array.from({ length: 9 }, (_, i) => items[i % items.length] || { id: `p${i}`, url: '' });
            setPhotos(repeated);
          }
        })
        .catch(() => setPhotos(Array.from({ length: 9 }, (_, i) => ({ id: `p${i}`, url: '' }))));
    }
  }, [open]);

  const handleImageClick = (imageUrl: string) => {
    console.log('Gallery image clicked:', imageUrl);
    console.log('onImageSelect function:', onImageSelect);
    
    if (!imageUrl) return;
    
    onClose(); // Close the popup
    
    if (onImageSelect && typeof onImageSelect === 'function') {
      console.log('Calling onImageSelect with:', imageUrl);
      onImageSelect(imageUrl); // Add image to conversation and analyze
    } else {
      console.error('onImageSelect is not available or not a function');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Image Gallery</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {photos.map((photo, i) => (
            <div 
              key={photo.id} 
              className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleImageClick(photo.url)}
            >
              {photo.url ? (
                <img src={photo.url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Photo {i + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
