import './Carrossel.css';

const Carrossel = () => {
  const images = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=250&h=100&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=250&h=100&fit=crop',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=250&h=100&fit=crop',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=250&h=100&fit=crop',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=250&h=100&fit=crop',
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=250&h=100&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=250&h=100&fit=crop'
  ];

  // Duplicar imagens para efeito infinito
  const duplicatedImages = [...images, ...images];

  return (
    <div className="slider">
      <div className="slide-track">
        {duplicatedImages.map((image, index) => (
          <div key={index} className="slide">
            <img src={image} height="100" width="250" alt={`Slide ${index + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Carrossel;