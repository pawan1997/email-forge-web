'use client';

import { useState, useRef } from 'react';
import {
  PosterConfig,
  PosterStyle,
  PosterSize,
  PosterMode,
  POSTER_SIZE_DIMENSIONS,
  GeneratedPoster,
} from '../types/poster';
import { TEMPLATE_IMAGES } from '../lib/templates';

// API key is now handled server-side via environment variables

interface PosterCreatorProps {
  onBack?: () => void;
}

export default function PosterCreator({ onBack }: PosterCreatorProps) {
  // Simple form state
  const [topmateUsername, setTopmateUsername] = useState('');
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceSource, setReferenceSource] = useState<'upload' | 'template' | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [mode, setMode] = useState<PosterMode>('single');
  const [slideCount, setSlideCount] = useState(5);
  const [selectedModel, setSelectedModel] = useState<'pro' | 'flash'>('pro');

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [isCompletingCarousel, setIsCompletingCarousel] = useState(false);
  const [posters, setPosters] = useState<GeneratedPoster[]>([]);
  const [carousels, setCarousels] = useState<GeneratedPoster[][]>([]); // For carousel: array of variants
  const [selectedVariant, setSelectedVariant] = useState(0); // Which carousel variant (A, B, C, D)
  const [selectedSlide, setSelectedSlide] = useState(0); // Which slide within the variant
  const [selectedIndex, setSelectedIndex] = useState(0); // For single mode
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<'png' | 'pdf' | 'all-png' | 'pdf-carousel' | null>(null);
  const [resultMode, setResultMode] = useState<'single' | 'carousel'>('single');
  const [isCarouselPreview, setIsCarouselPreview] = useState(false); // True when only first slides are shown
  const [totalSlides, setTotalSlides] = useState(5); // Total slides for carousel completion
  const [carouselProfile, setCarouselProfile] = useState<any>(null); // Store profile for completion

  // Current selected poster (single mode) or slide (carousel mode)
  const poster = resultMode === 'carousel'
    ? carousels[selectedVariant]?.[selectedSlide] || null
    : posters[selectedIndex] || null;

  // Current carousel slides for the selected variant
  const currentCarouselSlides = carousels[selectedVariant] || [];

  // Preview ref
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target?.result as string);
      setReferenceSource('upload');
    };
    reader.readAsDataURL(file);
  };

  // Clear reference image
  const clearReferenceImage = () => {
    setReferenceImage(null);
    setReferenceSource(null);
  };

  // Select template image
  const handleSelectTemplate = (url: string) => {
    setReferenceImage(url);
    setReferenceSource('template');
    setShowTemplates(false);
  };

  // Generate poster
  const handleGenerate = async () => {
    if (!topmateUsername.trim()) {
      setError('Please enter a Topmate username');
      return;
    }

    if (!prompt.trim()) {
      setError('Please describe what poster you want');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const config: PosterConfig = {
        topmateUsername: topmateUsername.trim(),
        style: 'professional' as PosterStyle,
        size: 'instagram-square' as PosterSize,
        mode: mode,
        carouselSlides: mode === 'carousel' ? slideCount : undefined,
        prompt: prompt.trim() + (referenceImage ? '\n\nUse the uploaded reference image as design inspiration.' : ''),
        includeStats: true,
        includeBadges: true,
      };

      const response = await fetch('/api/generate-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          referenceImage: referenceImage || undefined,
          model: selectedModel, // 'pro' or 'flash'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      if (data.mode === 'carousel') {
        // Carousel mode: data.carousels is array of variants, each containing slides
        setCarousels(data.carousels);
        setSelectedVariant(0);
        setSelectedSlide(0);
        setPosters([]); // Clear single mode posters
        // Check if this is preview-only (first slides only)
        setIsCarouselPreview(data.previewOnly || false);
        setTotalSlides(data.totalSlides || slideCount);
        // Store profile for completion API
        if (data.carousels[0]?.[0]?.topmateProfile) {
          setCarouselProfile(data.carousels[0][0].topmateProfile);
        }
      } else {
        // Single mode: data.posters is array of variant posters
        setPosters(data.posters);
        setSelectedIndex(0);
        setCarousels([]); // Clear carousel data
        setIsCarouselPreview(false);
      }
      setResultMode(data.mode || 'single');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate poster');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy HTML
  const handleCopyHtml = () => {
    if (poster?.html) {
      navigator.clipboard.writeText(poster.html);
    }
  };

  // Download single poster
  const handleDownload = async (format: 'png' | 'pdf') => {
    if (!poster?.html) return;

    setIsExporting(format);
    setError(null);

    try {
      const response = await fetch('/api/export-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: poster.html,
          format,
          width: poster.dimensions.width,
          height: poster.dimensions.height,
          scale: 2, // 2x for high-res PNG
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Export failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix = resultMode === 'carousel' ? `-slide${selectedIndex + 1}` : '';
      a.download = `poster${suffix}-${poster.dimensions.width}x${poster.dimensions.height}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(null);
    }
  };

  // Download all carousel slides as individual PNGs (for current variant)
  const handleDownloadAllPng = async () => {
    if (currentCarouselSlides.length === 0) return;

    setIsExporting('all-png');
    setError(null);

    try {
      const variantLabel = ['A', 'B', 'C', 'D'][selectedVariant] || selectedVariant + 1;
      for (let i = 0; i < currentCarouselSlides.length; i++) {
        const p = currentCarouselSlides[i];
        const response = await fetch('/api/export-poster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            html: p.html,
            format: 'png',
            width: p.dimensions.width,
            height: p.dimensions.height,
            scale: 2,
          }),
        });

        if (!response.ok) continue;

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `carousel-${variantLabel}-slide-${i + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Small delay between downloads
        await new Promise(r => setTimeout(r, 300));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(null);
    }
  };

  // Download carousel as multi-page PDF (for current variant)
  const handleDownloadCarouselPdf = async () => {
    if (currentCarouselSlides.length === 0) return;

    setIsExporting('pdf-carousel');
    setError(null);

    try {
      const variantLabel = ['A', 'B', 'C', 'D'][selectedVariant] || selectedVariant + 1;
      const response = await fetch('/api/export-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: currentCarouselSlides.map(p => p.html),
          format: 'pdf-multi',
          width: currentCarouselSlides[0].dimensions.width,
          height: currentCarouselSlides[0].dimensions.height,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carousel-${variantLabel}-${currentCarouselSlides.length}slides.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(null);
    }
  };

  // Complete carousel - generate remaining slides for selected variant
  const handleCompleteCarousel = async () => {
    if (!isCarouselPreview || carousels.length === 0) return;

    const selectedFirstSlide = carousels[selectedVariant]?.[0];
    if (!selectedFirstSlide) return;

    setIsCompletingCarousel(true);
    setError(null);

    try {
      const response = await fetch('/api/complete-carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstSlide: selectedFirstSlide.html,
          prompt: prompt.trim(),
          profile: carouselProfile || selectedFirstSlide.topmateProfile,
          totalSlides: totalSlides,
          variantIndex: selectedVariant,
          size: 'instagram-square',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete carousel');
      }

      // Update the selected carousel with all slides
      const newCarousels = [...carousels];
      newCarousels[selectedVariant] = data.slides;
      setCarousels(newCarousels);
      setIsCarouselPreview(false);
      setSelectedSlide(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete carousel');
    } finally {
      setIsCompletingCarousel(false);
    }
  };

  // Dimensions for preview
  const dimensions = POSTER_SIZE_DIMENSIONS['instagram-square'];
  const previewScale = Math.min(500 / dimensions.width, 500 / dimensions.height, 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">Poster Creator</h1>
            <p className="text-sm text-slate-500">Create posters from Topmate profiles</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Topmate Username */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Topmate Username
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-slate-500 text-sm">
                  topmate.io/
                </span>
                <input
                  type="text"
                  value={topmateUsername}
                  onChange={(e) => setTopmateUsername(e.target.value)}
                  placeholder="username"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Reference Image */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Design Reference (Optional)
                </label>
                {referenceImage && (
                  <button
                    onClick={clearReferenceImage}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              {referenceImage ? (
                <div className="relative">
                  <img
                    src={referenceImage}
                    alt="Reference"
                    className="w-full h-48 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                    {referenceSource === 'template' ? 'Template' : 'Custom Upload'}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Upload Option */}
                  <label className="flex items-center gap-3 w-full p-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-sm text-slate-600">Upload your own image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Template Toggle */}
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="flex items-center justify-between w-full p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                      <span className="text-sm text-slate-600">Choose from templates</span>
                    </div>
                    <svg className={`w-5 h-5 text-slate-400 transition-transform ${showTemplates ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Template Gallery */}
                  {showTemplates && (
                    <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">
                      {TEMPLATE_IMAGES.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template.url)}
                          className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all hover:scale-105"
                        >
                          <img
                            src={template.url}
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Prompt */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What poster do you want?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'carousel'
                  ? "e.g., 5 tips for landing your first tech job..."
                  : "e.g., A bold poster promoting 1:1 mentorship sessions with dark theme and neon accents..."}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Mode Toggle */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Output Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('single')}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                    mode === 'single'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Single Poster
                </button>
                <button
                  onClick={() => setMode('carousel')}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                    mode === 'carousel'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Carousel
                </button>
              </div>

              {mode === 'carousel' && (
                <div className="mt-4">
                  <label className="block text-sm text-slate-600 mb-2">
                    Number of slides: {slideCount}
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={10}
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>3</span>
                    <span>10</span>
                  </div>
                </div>
              )}
            </div>

            {/* Model Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                AI Model
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedModel('pro')}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                    selectedModel === 'pro'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span>Gemini 3 Pro</span>
                    <span className="text-xs opacity-75">Best quality</span>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedModel('flash')}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                    selectedModel === 'flash'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span>Gemini 3 Flash</span>
                    <span className="text-xs opacity-75">Faster</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isLoading || !topmateUsername.trim() || !prompt.trim()}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {mode === 'carousel' ? `Generating 3 variants...` : 'Generating 3 variations...'}
                </span>
              ) : (
                mode === 'carousel' ? `Generate ${slideCount}-Slide Carousel` : 'Generate Posters'
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {resultMode === 'carousel'
                  ? `Variant ${['A', 'B', 'C', 'D'][selectedVariant]} - Slide ${selectedSlide + 1} of ${currentCarouselSlides.length}`
                  : 'Preview'}
              </h2>
              {poster && (
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Single slide PNG */}
                  <button
                    onClick={() => handleDownload('png')}
                    disabled={isExporting !== null}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {isExporting === 'png' ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    PNG
                  </button>

                  {/* Carousel-specific: Download all PNGs */}
                  {resultMode === 'carousel' && (
                    <button
                      onClick={handleDownloadAllPng}
                      disabled={isExporting !== null}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {isExporting === 'all-png' ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                      All PNGs
                    </button>
                  )}

                  {/* Carousel-specific: Multi-page PDF */}
                  {resultMode === 'carousel' && (
                    <button
                      onClick={handleDownloadCarouselPdf}
                      disabled={isExporting !== null}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {isExporting === 'pdf-carousel' ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )}
                      PDF
                    </button>
                  )}

                  {/* Single mode: single PDF */}
                  {resultMode === 'single' && (
                    <button
                      onClick={() => handleDownload('pdf')}
                      disabled={isExporting !== null}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {isExporting === 'pdf' ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )}
                      PDF
                    </button>
                  )}

                  <button
                    onClick={handleCopyHtml}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    HTML
                  </button>
                </div>
              )}
            </div>

            {/* Main Preview */}
            <div className="flex items-center justify-center bg-slate-100 rounded-lg min-h-[400px]">
              {poster ? (
                <div
                  style={{
                    width: dimensions.width * previewScale,
                    height: dimensions.height * previewScale,
                  }}
                  className="shadow-2xl"
                >
                  <iframe
                    ref={previewRef}
                    srcDoc={poster.html}
                    style={{
                      width: dimensions.width,
                      height: dimensions.height,
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top left',
                    }}
                    className="border-0"
                    title="Poster Preview"
                  />
                </div>
              ) : (
                <div className="text-center text-slate-400 p-8">
                  <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="font-medium">Your posters will appear here</p>
                </div>
              )}
            </div>

            {/* Single Mode: Variant Thumbnails */}
            {resultMode === 'single' && posters.length > 1 && (
              <div className="mt-4">
                <p className="text-sm text-slate-500 mb-2">Choose a variation:</p>
                <div className="grid gap-2 grid-cols-3">
                  {posters.map((p, index) => {
                    const thumbScale = 0.1;
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedIndex(index)}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                          selectedIndex === index
                            ? 'border-indigo-500 ring-2 ring-indigo-200'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        style={{
                          width: dimensions.width * thumbScale,
                          height: dimensions.height * thumbScale,
                        }}
                      >
                        <iframe
                          srcDoc={p.html}
                          style={{
                            width: dimensions.width,
                            height: dimensions.height,
                            transform: `scale(${thumbScale})`,
                            transformOrigin: 'top left',
                            pointerEvents: 'none',
                          }}
                          className="border-0"
                          title={`Variant ${index + 1}`}
                        />
                        <div className={`absolute inset-0 flex items-end justify-center pb-1 bg-gradient-to-t from-black/50 to-transparent ${
                          selectedIndex === index ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                        } transition-opacity`}>
                          <span className="text-white text-xs font-medium">
                            {['A', 'B', 'C'][index]}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Carousel Mode: Variant Selection + Slide Thumbnails */}
            {resultMode === 'carousel' && carousels.length > 0 && (
              <div className="mt-4 space-y-4">
                {/* Preview Mode Notice + Complete Button */}
                {isCarouselPreview && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800 mb-3">
                      <strong>Preview mode:</strong> Pick your favorite style, then generate all {totalSlides} slides.
                    </p>
                    <button
                      onClick={handleCompleteCarousel}
                      disabled={isCompletingCarousel}
                      className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {isCompletingCarousel ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Generating {totalSlides} slides...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate Full Carousel ({totalSlides} slides)
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Variant Selection (A, B, C) */}
                <div>
                  <p className="text-sm text-slate-500 mb-2">
                    {isCarouselPreview ? 'Choose a style:' : 'Style Variant:'}
                  </p>
                  <div className="flex gap-2">
                    {carousels.map((_, variantIdx) => (
                      <button
                        key={variantIdx}
                        onClick={() => {
                          setSelectedVariant(variantIdx);
                          setSelectedSlide(0); // Reset to first slide
                        }}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                          selectedVariant === variantIdx
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {['A', 'B', 'C'][variantIdx]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slide Thumbnails for Selected Variant (only show if not preview or has multiple slides) */}
                {(!isCarouselPreview || currentCarouselSlides.length > 1) && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Slides:</p>
                  <div className="grid gap-2 grid-cols-5">
                    {currentCarouselSlides.map((p, slideIdx) => {
                      const thumbScale = 0.06;
                      return (
                        <button
                          key={slideIdx}
                          onClick={() => setSelectedSlide(slideIdx)}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                            selectedSlide === slideIdx
                              ? 'border-indigo-500 ring-2 ring-indigo-200'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          style={{
                            width: dimensions.width * thumbScale,
                            height: dimensions.height * thumbScale,
                          }}
                        >
                          <iframe
                            srcDoc={p.html}
                            style={{
                              width: dimensions.width,
                              height: dimensions.height,
                              transform: `scale(${thumbScale})`,
                              transformOrigin: 'top left',
                              pointerEvents: 'none',
                            }}
                            className="border-0"
                            title={`Slide ${slideIdx + 1}`}
                          />
                          <div className={`absolute inset-0 flex items-end justify-center pb-1 bg-gradient-to-t from-black/50 to-transparent ${
                            selectedSlide === slideIdx ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                          } transition-opacity`}>
                            <span className="text-white text-xs font-medium">
                              {slideIdx + 1}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
