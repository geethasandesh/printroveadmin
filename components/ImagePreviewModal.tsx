import { Modal } from "@shopify/polaris";
import { UploadedImage } from "@/utils/s3Upload";

interface ImagePreviewModalProps {
  open: boolean;
  onClose: () => void;
  images: UploadedImage[];
  title: string;
  onDelete?: (index: number) => void;
}

export function ImagePreviewModal({
  open,
  onClose,
  images,
  title,
  onDelete,
}: ImagePreviewModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      primaryAction={{
        content: "Close",
        onAction: onClose,
      }}
    >
      <Modal.Section>
        <div className="grid grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={image.key} className="relative group">
              <img
                src={image.url}
                alt={`${title} ${index + 1}`}
                className="w-full h-40 object-cover rounded-md"
              />
              {onDelete && (
                <button
                  onClick={() => onDelete(index)}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="text-red-500 font-bold">×</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </Modal.Section>
    </Modal>
  );
}
