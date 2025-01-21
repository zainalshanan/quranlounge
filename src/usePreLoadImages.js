import { useEffect, useState } from 'react';

export default function usePreloadImages(imageUrls = []) {
  const [loadedImages, setLoadedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    const promises = imageUrls.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        })
    );

    Promise.all(promises).then((results) => {
      if (!isSubscribed) return;
      const filtered = results.filter(Boolean); // remove nulls if load failed
      setLoadedImages(filtered);
      setIsLoading(false);
    });

    return () => {
      isSubscribed = false;
    };
  }, [imageUrls]);

  return { loadedImages, isLoading };
}
