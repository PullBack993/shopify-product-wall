import { ref, watch, onMounted, onUnmounted, type Ref } from "vue";
import type { GridImage } from "../types";

export function useImageRotation(gridImages: Ref<GridImage[]>) {
  const displayImages = ref<GridImage[]>([]); // Images currently displayed
  const rotationQueues = ref<GridImage[][]>([]); // Queue for each column
  const visibleImages = ref<Set<string>>(new Set()); // Track visible image IDs
  const totalProductsShown = ref(0);
  const currentCycle = ref(1);

  // Intersection Observer for visibility tracking
  let intersectionObserver: IntersectionObserver | null = null;
  let rotateInterval: ReturnType<typeof setInterval>;

  console.log("🚀 useImageRotation composable initialized with SMART MARQUEE");
  console.log(`   • Grid images available: ${gridImages.value.length}`);

  // Initialize display images and queues for marquee columns
  const initializeDisplayImages = (
    maxDisplayImages: number,
    numColumns: number
  ) => {
    if (gridImages.value.length === 0) return;

    // Use a reasonable number of images to display at once
    const displayCount = Math.min(maxDisplayImages, gridImages.value.length);
    const imagesPerColumn = Math.ceil(displayCount / numColumns);

    // Initialize queues for each column
    rotationQueues.value = Array(numColumns)
      .fill(null)
      .map(() => []);

    // Distribute images across columns
    const columnImages: GridImage[][] = Array(numColumns)
      .fill(null)
      .map(() => []);

    // Fill columns with initial images
    let imageIndex = 0;
    for (let col = 0; col < numColumns; col++) {
      for (
        let row = 0;
        row < imagesPerColumn && imageIndex < displayCount;
        row++
      ) {
        if (imageIndex < gridImages.value.length) {
          columnImages[col].push({
            ...gridImages.value[imageIndex],
            id: `${gridImages.value[imageIndex].id}-col-${col}-row-${row}`,
            columnIndex: col,
            rowIndex: row,
            isEvenColumn: col % 2 === 0,
          });
          imageIndex++;
        }
      }
    }

    // Put remaining images in rotation queues
    while (imageIndex < gridImages.value.length) {
      const columnIndex = imageIndex % numColumns;
      rotationQueues.value[columnIndex].push({
        ...gridImages.value[imageIndex],
      });
      imageIndex++;
    }

    // Flatten column images for display
    const flatImages: GridImage[] = [];
    for (let col = 0; col < numColumns; col++) {
      flatImages.push(...columnImages[col]);
    }

    displayImages.value = flatImages;
    totalProductsShown.value = displayCount;
    currentCycle.value = 1;

    console.log(`✅ SMART MARQUEE INITIALIZED:`);
    console.log(`   • Columns: ${numColumns}`);
    console.log(`   • Images per column: ~${imagesPerColumn}`);
    console.log(`   • Screen images: ${displayCount}`);
    console.log(
      `   • Queue distribution:`,
      rotationQueues.value.map((q) => q.length)
    );
    console.log(`   • Only off-screen images will be rotated`);
  };

  // Setup intersection observer to track visible images
  const setupVisibilityTracking = () => {
    if (intersectionObserver) {
      intersectionObserver.disconnect();
    }

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const imageId = entry.target.getAttribute("data-image-id");
          if (imageId) {
            if (entry.isIntersecting) {
              visibleImages.value.add(imageId);
            } else {
              visibleImages.value.delete(imageId);
            }
          }
        });

        console.log(
          `👀 Visible images: ${visibleImages.value.size}/${displayImages.value.length}`
        );
      },
      {
        root: null, // Use viewport as root
        rootMargin: "50px", // Consider images 50px outside viewport as "about to be visible"
        threshold: 0.1, // Trigger when 10% of image is visible
      }
    );

    // Observe all image elements
    setTimeout(() => {
      const imageElements = document.querySelectorAll("[data-image-id]");
      imageElements.forEach((el) => {
        if (intersectionObserver) {
          intersectionObserver.observe(el);
        }
      });
      console.log(`📊 Observing ${imageElements.length} images for visibility`);
    }, 1000);
  };

  // Rotate only off-screen images
  const rotateOffScreenImages = () => {
    console.log(`🔄 SMART ROTATION - Off-screen images only:`);
    console.log(`   • Total images: ${displayImages.value.length}`);
    console.log(`   • Visible images: ${visibleImages.value.size}`);
    console.log(
      `   • Off-screen images: ${
        displayImages.value.length - visibleImages.value.size
      }`
    );

    if (displayImages.value.length === 0) {
      console.log("⚠️ No images to rotate");
      return;
    }

    // Find off-screen images that can be rotated
    const offScreenImages = displayImages.value.filter(
      (img) => !visibleImages.value.has(img.id)
    );

    if (offScreenImages.length === 0) {
      console.log("⚠️ No off-screen images to rotate");
      return;
    }

    // Group off-screen images by column
    const offScreenByColumn: { [key: number]: GridImage[] } = {};
    offScreenImages.forEach((img) => {
      const col = img.columnIndex || 0;
      if (!offScreenByColumn[col]) {
        offScreenByColumn[col] = [];
      }
      offScreenByColumn[col].push(img);
    });

    // Rotate 1-3 random off-screen images
    const rotationsToPerform = Math.min(
      3,
      Math.floor(offScreenImages.length / 3) + 1
    );
    let rotationsCompleted = 0;

    for (let i = 0; i < rotationsToPerform; i++) {
      // Select random off-screen image
      const randomImage =
        offScreenImages[Math.floor(Math.random() * offScreenImages.length)];
      const columnIndex = randomImage.columnIndex || 0;

      // Check if this column has images in queue
      if (
        rotationQueues.value[columnIndex] &&
        rotationQueues.value[columnIndex].length > 0
      ) {
        // Get new image from queue
        const newImage = rotationQueues.value[columnIndex].shift()!;

        // Replace the off-screen image
        const imageIndex = displayImages.value.findIndex(
          (img) => img.id === randomImage.id
        );
        if (imageIndex !== -1) {
          const replacementImage = {
            ...newImage,
            id: `${newImage.id}-col-${columnIndex}-rotation-${Date.now()}`,
            columnIndex: columnIndex,
            rowIndex: randomImage.rowIndex,
            isEvenColumn: columnIndex % 2 === 0,
            url: `${newImage.url}?t=${Date.now()}`,
          };

          // Update the image in display array
          displayImages.value[imageIndex] = replacementImage;

          // Put old image back in queue
          const originalImage = {
            ...randomImage,
            id: randomImage.id.split("-col-")[0].split("-rotation-")[0],
            url: randomImage.url.split("?t=")[0],
          };
          rotationQueues.value[columnIndex].push(originalImage);

          console.log(
            `   • ✅ Rotated off-screen image in column ${columnIndex}`
          );
          console.log(`   • Old: "${randomImage.text}"`);
          console.log(`   • New: "${replacementImage.text}"`);

          rotationsCompleted++;
        }
      }
    }

    console.log(`   • Completed ${rotationsCompleted} off-screen rotations`);

    // Update visibility tracking after rotation
    setTimeout(() => {
      setupVisibilityTracking();
    }, 500);
  };

  // Auto rotate off-screen images
  const startAutoRotate = () => {
    if (rotateInterval) {
      clearInterval(rotateInterval);
    }

    const rotationIntervalMs = import.meta.env.DEV ? 5000 : 8000; // 5s in dev, 8s in production

    console.log(
      `🔄 Starting smart rotation every ${rotationIntervalMs / 1000}s`
    );
    console.log(`   • Only off-screen images will be rotated`);

    if (displayImages.value.length === 0) {
      console.log("⚠️ Cannot start rotation - no images");
      return;
    }

    // Setup visibility tracking
    setupVisibilityTracking();

    rotateInterval = setInterval(() => {
      console.log(`⏰ Auto-rotation timer fired`);
      rotateOffScreenImages();
    }, rotationIntervalMs);

    console.log(`✅ Smart rotation started`);
  };

  const stopAutoRotate = () => {
    if (rotateInterval) {
      clearInterval(rotateInterval);
    }
    if (intersectionObserver) {
      intersectionObserver.disconnect();
    }
    visibleImages.value.clear();
  };

  // Shuffle images
  const shuffleImages = async (
    maxDisplayImages: number,
    numColumns: number
  ) => {
    if (gridImages.value.length === 0) return;

    try {
      stopAutoRotate();
      initializeDisplayImages(maxDisplayImages, numColumns);
      await new Promise((resolve) => setTimeout(resolve, 500));
      startAutoRotate();
    } catch (error) {
      console.error("Error shuffling images:", error);
    }
  };

  // Manual rotation for testing
  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.code === "Space" && import.meta.env.DEV) {
      event.preventDefault();
      console.log("🔥 MANUAL OFF-SCREEN ROTATION TRIGGERED");
      rotateOffScreenImages();
    }
  };

  // Simple rotation alias for compatibility
  const rotateNextImage = rotateOffScreenImages;

  // Cleanup on unmount
  onUnmounted(() => {
    stopAutoRotate();
  });

  return {
    displayImages,
    rotationQueues,
    visibleImages,
    currentImageIndex: ref(0),
    totalProductsShown,
    currentCycle,
    initializeDisplayImages,
    rotateNextImage,
    startAutoRotate,
    stopAutoRotate,
    shuffleImages,
    handleKeyPress,
    setupVisibilityTracking,
  };
}
