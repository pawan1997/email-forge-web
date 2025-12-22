import { NextRequest, NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import { PDFDocument } from 'pdf-lib';

// Check if running in production/serverless environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

async function getBrowser() {
  if (isProduction) {
    // Use @sparticuz/chromium for serverless (Vercel)
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    // Use regular puppeteer for local development
    return puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
}

export async function POST(request: NextRequest) {
  let browser = null;

  try {
    const { html, format, width, height, scale = 2 } = await request.json();

    if (!html || !format || !width || !height) {
      return NextResponse.json(
        { error: 'Missing required fields: html, format, width, height' },
        { status: 400 }
      );
    }

    if (format !== 'png' && format !== 'pdf' && format !== 'pdf-multi') {
      return NextResponse.json(
        { error: 'Format must be "png", "pdf", or "pdf-multi"' },
        { status: 400 }
      );
    }

    // For pdf-multi, html should be an array
    if (format === 'pdf-multi' && !Array.isArray(html)) {
      return NextResponse.json(
        { error: 'pdf-multi format requires html to be an array of HTML strings' },
        { status: 400 }
      );
    }

    // Launch browser (works for both local and serverless)
    browser = await getBrowser();

    const page = await browser.newPage();

    // Handle multi-page PDF for carousel
    if (format === 'pdf-multi') {
      const htmlArray = html as string[];
      const pdfWidth = width / 96; // Convert px to inches (96 DPI)
      const pdfHeight = height / 96;

      // Create merged PDF document
      const mergedPdf = await PDFDocument.create();

      // Generate PDF for each slide and merge
      for (let i = 0; i < htmlArray.length; i++) {
        await page.setViewport({ width, height, deviceScaleFactor: 1 });
        await page.setContent(htmlArray[i], {
          waitUntil: ['load', 'networkidle0'],
          timeout: 30000,
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        const slideBuffer = await page.pdf({
          width: `${pdfWidth}in`,
          height: `${pdfHeight}in`,
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        });

        // Load the slide PDF and copy its page to merged doc
        const slidePdf = await PDFDocument.load(slideBuffer);
        const [copiedPage] = await mergedPdf.copyPages(slidePdf, [0]);
        mergedPdf.addPage(copiedPage);
      }

      const mergedBuffer = await mergedPdf.save();

      await browser.close();
      browser = null;

      return new NextResponse(Buffer.from(mergedBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="carousel-${htmlArray.length}-slides.pdf"`,
          'Content-Length': mergedBuffer.byteLength.toString(),
        },
      });
    }

    // Set viewport to exact poster dimensions
    await page.setViewport({
      width: width,
      height: height,
      deviceScaleFactor: format === 'png' ? scale : 1,
    });

    // Set content and wait for fonts/images to load
    await page.setContent(html, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000,
    });

    // Wait a bit extra for any web fonts to render
    await new Promise(resolve => setTimeout(resolve, 500));

    let buffer: Uint8Array;
    let contentType: string;
    let filename: string;

    if (format === 'png') {
      // High-res PNG screenshot
      buffer = await page.screenshot({
        type: 'png',
        fullPage: false,
        omitBackground: false,
      });
      contentType = 'image/png';
      filename = `poster-${width}x${height}@${scale}x.png`;
    } else {
      // PDF with exact dimensions
      const pdfWidth = width / 96; // Convert px to inches (96 DPI)
      const pdfHeight = height / 96;

      buffer = await page.pdf({
        width: `${pdfWidth}in`,
        height: `${pdfHeight}in`,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      contentType = 'application/pdf';
      filename = `poster-${width}x${height}.pdf`;
    }

    await browser.close();
    browser = null;

    // Return the file
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Export error:', error);

    if (browser) {
      await browser.close();
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}

// Increase function timeout for Vercel
export const maxDuration = 60;
