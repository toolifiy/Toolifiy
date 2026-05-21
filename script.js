document.addEventListener('DOMContentLoaded', () => {
    
    // --- Page Loader Injection & Intercept Clicks ---
    const loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.innerHTML = `
        <div class="loader-content">
            <div class="loader-spinner-container">
                <div class="loader-spinner"></div>
            </div>
            <div class="loader-text">Securing browser environment...</div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill"></div>
            </div>
        </div>
    `;
    document.body.appendChild(loader);

    // Intercept nav links, footer links, and logo links for smooth transition
    const linksToTransition = document.querySelectorAll('.nav-item, .footer-links a, .logo a');
    linksToTransition.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetUrl = link.getAttribute('href');
            // If it's a valid link, not pointing to anchor on same page, and not a mailto link
            if (targetUrl && targetUrl !== '#' && !targetUrl.startsWith('#') && !targetUrl.startsWith('mailto:')) {
                const currentFile = window.location.pathname.split('/').pop() || 'index.html';
                let targetFile = targetUrl.split('/').pop();
                if (targetFile === '') targetFile = 'index.html';
                
                // If current file is different from target, intercept
                if (currentFile !== targetFile) {
                    e.preventDefault();
                    
                    // Set loading text based on destination
                    const loaderText = loader.querySelector('.loader-text');
                    if (loaderText) {
                        if (targetUrl.includes('txt-to-pdf')) {
                            loaderText.textContent = 'Initializing Text to PDF Converter...';
                        } else if (targetUrl.includes('merge-pdf')) {
                            loaderText.textContent = 'Preparing PDF Merger module...';
                        } else if (targetUrl.includes('pdf-to-img')) {
                            loaderText.textContent = 'Setting up PDF to JPG Renderer...';
                        } else if (targetUrl.includes('watermark-pdf')) {
                            loaderText.textContent = 'Loading Watermark module...';
                        } else if (targetUrl.includes('index.html')) {
                            loaderText.textContent = 'Activating Image to PDF Engine...';
                        } else {
                            loaderText.textContent = 'Securing page environment...';
                        }
                    }
                    
                    // Show loader
                    loader.classList.add('show');
                    
                    // Start progress bar animation
                    setTimeout(() => {
                        const fill = loader.querySelector('.progress-bar-fill');
                        if (fill) fill.style.width = '100%';
                    }, 50);
                    
                    // Navigate after 1.5 seconds
                    setTimeout(() => {
                        window.location.href = targetUrl;
                    }, 1500);
                }
            }
        });
    });

    // Ensure loader is hidden on pageshow (handles browser Back button / bfcache recovery)
    window.addEventListener('pageshow', () => {
        if (loader) {
            loader.classList.remove('show');
            const fill = loader.querySelector('.progress-bar-fill');
            if (fill) fill.style.width = '0%';
        }
    });
    
    // Exit early on static pages (Privacy Policy, Terms, Contact) to avoid TypeErrors
    if (!document.querySelector('.tool-section')) {
        return;
    }
    
    // --- Utility Functions ---
    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    // ==========================================
    // 1. IMAGE TO PDF CONVERTER
    // ==========================================
    const imgPdfDropzone = document.getElementById('img-pdf-dropzone');
    const imgPdfInput = document.getElementById('img-pdf-input');
    const imgPdfPreview = document.getElementById('img-pdf-preview');
    const imgList = document.getElementById('img-list');
    const imgCountSpan = document.getElementById('img-count');
    const btnImgToPdf = document.getElementById('btn-img-to-pdf');
    
    let selectedImages = [];

    // Drag & Drop Handlers
    imgPdfDropzone.addEventListener('click', () => imgPdfInput.click());
    
    imgPdfDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        imgPdfDropzone.classList.add('dragover');
    });
    
    imgPdfDropzone.addEventListener('dragleave', () => {
        imgPdfDropzone.classList.remove('dragover');
    });
    
    imgPdfDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        imgPdfDropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleImageFiles(Array.from(e.dataTransfer.files));
        }
    });

    imgPdfInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageFiles(Array.from(e.target.files));
        }
    });

    function handleImageFiles(files) {
        const validFiles = files.filter(file => file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp)$/i.test(file.name));
        
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                selectedImages.push({
                    file: file,
                    dataUrl: e.target.result,
                    id: Date.now() + Math.random()
                });
                updateImagePreview();
            };
            reader.readAsDataURL(file);
        });
    }

    function updateImagePreview() {
        imgList.innerHTML = '';
        imgCountSpan.textContent = selectedImages.length;
        
        if (selectedImages.length > 0) {
            imgPdfPreview.style.display = 'block';
            btnImgToPdf.disabled = false;
        } else {
            imgPdfPreview.style.display = 'none';
            btnImgToPdf.disabled = true;
        }

        selectedImages.forEach(img => {
            const div = document.createElement('div');
            div.className = 'img-preview-item';
            
            const imageEl = document.createElement('img');
            imageEl.src = img.dataUrl;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-img-btn';
            removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                selectedImages = selectedImages.filter(item => item.id !== img.id);
                updateImagePreview();
            };
            
            div.appendChild(imageEl);
            div.appendChild(removeBtn);
            imgList.appendChild(div);
        });
    }    btnImgToPdf.addEventListener('click', async () => {
        if (selectedImages.length === 0) return;
        
        const btnText = btnImgToPdf.querySelector('span');
        const spinner = btnImgToPdf.querySelector('.spinner');
        
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        btnImgToPdf.disabled = true;

        try {
            // Add a realistic 1.5s artificial delay for a premium experience
            await new Promise(resolve => setTimeout(resolve, 1500));

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            for (let i = 0; i < selectedImages.length; i++) {
                if (i > 0) pdf.addPage();
                
                const img = selectedImages[i];
                
                // Create an Image object to get dimensions
                const imageForDim = new Image();
                imageForDim.src = img.dataUrl;
                
                await new Promise(resolve => imageForDim.onload = resolve);
                
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                
                const imgRatio = imageForDim.width / imageForDim.height;
                const pageRatio = pageWidth / pageHeight;
                
                let renderWidth = pageWidth;
                let renderHeight = pageHeight;
                let x = 0;
                let y = 0;

                // Scale image to fit page maintaining aspect ratio
                if (imgRatio > pageRatio) {
                    renderHeight = renderWidth / imgRatio;
                    y = (pageHeight - renderHeight) / 2; // Center vertically
                } else {
                    renderWidth = renderHeight * imgRatio;
                    x = (pageWidth - renderWidth) / 2; // Center horizontally
                }
                
                pdf.addImage(img.dataUrl, 'JPEG', x, y, renderWidth, renderHeight);
            }
            
            const pdfBlob = pdf.output('blob');
            showPDFResultCard('img-to-pdf', pdfBlob, 'toolifiy_images.pdf', () => {
                selectedImages = [];
                updateImagePreview();
            });

        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('An error occurred while generating the PDF.');
        } finally {
            btnText.style.display = 'block';
            spinner.style.display = 'none';
            btnImgToPdf.disabled = false;
        }
    });
    // ==========================================
    // 2. TEXT TO PDF CONVERTER
    // ==========================================
    const btnTxtToPdf = document.getElementById('btn-txt-to-pdf');
    const txtPdfTitle = document.getElementById('txt-pdf-title');
    const txtPdfContent = document.getElementById('txt-pdf-content');    btnTxtToPdf.addEventListener('click', () => {
        const text = txtPdfContent.value.trim();
        if (!text) {
            alert('Please enter some text to convert.');
            return;
        }

        const btnText = btnTxtToPdf.querySelector('span');
        const spinner = btnTxtToPdf.querySelector('.spinner');
        
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        btnTxtToPdf.disabled = true;

        setTimeout(() => {
            try {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
                
                const margin = 20;
                let cursorY = margin;
                const pageWidth = pdf.internal.pageSize.getWidth();
                const textWidth = pageWidth - (margin * 2);

                const title = txtPdfTitle.value.trim();
                
                if (title) {
                    pdf.setFontSize(22);
                    pdf.setFont('helvetica', 'bold');
                    
                    // Center title
                    const titleWidth = pdf.getStringUnitWidth(title) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
                    const titleX = (pageWidth - titleWidth) / 2;
                    
                    pdf.text(title, titleX, cursorY);
                    cursorY += 15;
                }

                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'normal');
                
                // Split text to fit page width
                const splitText = pdf.splitTextToSize(text, textWidth);
                
                // Handle pagination
                const pageHeight = pdf.internal.pageSize.getHeight();
                
                for (let i = 0; i < splitText.length; i++) {
                    if (cursorY > pageHeight - margin) {
                        pdf.addPage();
                        cursorY = margin;
                    }
                    pdf.text(splitText[i], margin, cursorY);
                    cursorY += 7; // line height
                }
                
                const pdfBlob = pdf.output('blob');
                showPDFResultCard('txt-to-pdf', pdfBlob, 'toolifiy_document.pdf', () => {
                    txtPdfTitle.value = '';
                    txtPdfContent.value = '';
                    btnTxtToPdf.disabled = true;
                });

            } catch (error) {
                console.error('Text to PDF Error:', error);
                alert('Failed to generate PDF.');
            } finally {
                btnText.style.display = 'block';
                spinner.style.display = 'none';
            }
        }, 1500); // 1.5 seconds premium processing delay
    });
    // ==========================================
    // 3. MERGE PDF
    // ==========================================
    const mergeDropzone = document.getElementById('merge-pdf-dropzone');
    const mergeInput = document.getElementById('merge-pdf-input');
    const mergePreview = document.getElementById('merge-pdf-preview');
    const mergeList = document.getElementById('merge-list');
    const mergeCountSpan = document.getElementById('merge-count');
    const btnMergePdf = document.getElementById('btn-merge-pdf');
    
    let selectedMergePdfs = [];

    mergeDropzone.addEventListener('click', () => mergeInput.click());
    
    mergeDropzone.addEventListener('dragover', (e) => { e.preventDefault(); mergeDropzone.classList.add('dragover'); });
    mergeDropzone.addEventListener('dragleave', () => mergeDropzone.classList.remove('dragover'));
    
    mergeDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        mergeDropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleMergeFiles(Array.from(e.dataTransfer.files));
    });

    mergeInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleMergeFiles(Array.from(e.target.files));
    });

    function handleMergeFiles(files) {
        const validFiles = files.filter(file => file.type === 'application/pdf' || /\.pdf$/i.test(file.name));
        
        validFiles.forEach(file => {
            selectedMergePdfs.push({
                file: file,
                id: Date.now() + Math.random(),
                name: file.name
            });
        });
        updateMergePreview();
    }

    function updateMergePreview() {
        mergeList.innerHTML = '';
        mergeCountSpan.textContent = selectedMergePdfs.length;
        
        if (selectedMergePdfs.length > 0) {
            mergePreview.style.display = 'block';
            btnMergePdf.disabled = false;
        } else {
            mergePreview.style.display = 'none';
            btnMergePdf.disabled = true;
        }

        selectedMergePdfs.forEach(pdf => {
            const div = document.createElement('div');
            div.className = 'img-preview-item';
            div.style.background = '#e2e8f0';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
            div.style.flexDirection = 'column';
            div.style.padding = '10px';
            
            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-file-pdf';
            icon.style.fontSize = '2rem';
            icon.style.color = 'var(--primary)';
            
            const text = document.createElement('span');
            text.textContent = pdf.name;
            text.style.fontSize = '0.7rem';
            text.style.marginTop = '10px';
            text.style.wordBreak = 'break-all';
            text.style.textAlign = 'center';
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-img-btn';
            removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                selectedMergePdfs = selectedMergePdfs.filter(item => item.id !== pdf.id);
                updateMergePreview();
            };
            
            div.appendChild(icon);
            div.appendChild(text);
            div.appendChild(removeBtn);
            mergeList.appendChild(div);
        });
    }

    btnMergePdf.addEventListener('click', async () => {
        if (selectedMergePdfs.length === 0) return;
        
        const btnText = btnMergePdf.querySelector('span');
        const spinner = btnMergePdf.querySelector('.spinner');
        
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        btnMergePdf.disabled = true;

        try {
            // Add a realistic 1.5s artificial delay for a premium experience
            await new Promise(resolve => setTimeout(resolve, 1500));

            const { PDFDocument } = window.PDFLib;
            const mergedPdf = await PDFDocument.create();

            for (const item of selectedMergePdfs) {
                const arrayBuffer = await item.file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            showPDFResultCard('merge-pdf', blob, 'toolifiy_merged.pdf', () => {
                selectedMergePdfs = [];
                updateMergePreview();
                btnMergePdf.disabled = true;
            });
            
        } catch (error) {
            console.error('Merge PDF Error:', error);
            alert('An error occurred while merging PDFs.');
        } finally {
            btnText.style.display = 'block';
            spinner.style.display = 'none';
        }
    });

    // ==========================================
    // 5. PDF TO IMAGE
    // ==========================================
    // Setup PDF.js worker
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const pdfImgDropzone = document.getElementById('pdf-img-dropzone');
    const pdfImgInput = document.getElementById('pdf-img-input');
    const pdfImgInfo = document.getElementById('pdf-img-preview');
    const pdfImgList = document.getElementById('pdf-img-list');
    const btnPdfToImg = document.getElementById('btn-pdf-to-img');
    
    let fileToConvert = null;

    pdfImgDropzone.addEventListener('click', () => pdfImgInput.click());
    pdfImgDropzone.addEventListener('dragover', (e) => { e.preventDefault(); pdfImgDropzone.classList.add('dragover'); });
    pdfImgDropzone.addEventListener('dragleave', () => pdfImgDropzone.classList.remove('dragover'));
    
    pdfImgDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        pdfImgDropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0 && (e.dataTransfer.files[0].type === 'application/pdf' || /\.pdf$/i.test(e.dataTransfer.files[0].name))) {
            handlePdfToImgFile(e.dataTransfer.files[0]);
        }
    });

    pdfImgInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handlePdfToImgFile(e.target.files[0]);
    });

    function handlePdfToImgFile(file) {
        if (!(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) {
            alert('Please select a valid PDF file.');
            return;
        }
        
        fileToConvert = file;
        pdfImgList.innerHTML = '';
        
        const div = document.createElement('div');
        div.className = 'img-preview-item';
        div.style.background = '#e2e8f0';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.flexDirection = 'column';
        div.style.padding = '10px';
        
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-file-pdf';
        icon.style.fontSize = '2rem';
        icon.style.color = 'var(--primary)';
        
        const text = document.createElement('span');
        text.textContent = file.name;
        text.style.fontSize = '0.7rem';
        text.style.marginTop = '10px';
        text.style.wordBreak = 'break-all';
        text.style.textAlign = 'center';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-img-btn';
        removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            fileToConvert = null;
            pdfImgInfo.style.display = 'none';
            btnPdfToImg.disabled = true;
            pdfImgInput.value = '';
        };
        
        div.appendChild(icon);
        div.appendChild(text);
        div.appendChild(removeBtn);
        pdfImgList.appendChild(div);

        pdfImgInfo.style.display = 'block';
        btnPdfToImg.disabled = false;
    }

    btnPdfToImg.addEventListener('click', async () => {
        if (!fileToConvert) return;
        
        const btnText = btnPdfToImg.querySelector('span');
        const spinner = btnPdfToImg.querySelector('.spinner');
        
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        btnPdfToImg.disabled = true;

        try {
            // Add a realistic 1.5s artificial delay for a premium experience
            await new Promise(resolve => setTimeout(resolve, 1500));

            const arrayBuffer = await fileToConvert.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            const extractedImages = [];
            
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const scale = 2; // Higher scale for better quality
                const viewport = page.getViewport({ scale });
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                
                const imgData = canvas.toDataURL('image/jpeg', 0.9);
                extractedImages.push({
                    dataUrl: imgData,
                    name: `page_${pageNum}_${fileToConvert.name.replace('.pdf', '')}.jpg`
                });
            }

            // Get first page as blob for the result card (useful for sharing)
            const firstPageData = extractedImages[0].dataUrl;
            const res = await fetch(firstPageData);
            const firstPageBlob = await res.blob();

            showPDFResultCard('pdf-to-img', firstPageBlob, `page_1_${fileToConvert.name.replace('.pdf', '')}.jpg`, () => {
                fileToConvert = null;
                pdfImgInfo.style.display = 'none';
                pdfImgInput.value = '';
                btnPdfToImg.disabled = true;
            }, async () => {
                // Custom Download Callback for downloading all extracted pages
                for (let i = 0; i < extractedImages.length; i++) {
                    const item = extractedImages[i];
                    const a = document.createElement('a');
                    a.href = item.dataUrl;
                    a.download = item.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    // Small delay to prevent browser freezing/blocking multiple downloads
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            });
            
        } catch (error) {
            console.error('PDF to Image Error:', error);
            alert('An error occurred while converting the PDF.');
        } finally {
            btnText.style.display = 'block';
            spinner.style.display = 'none';
            btnPdfToImg.disabled = false;
        }
    });

    // 6. WATERMARK PDF
    // ==========================================
    const wmDropzone = document.getElementById('watermark-pdf-dropzone');
    const wmInput = document.getElementById('watermark-pdf-input');
    const wmControls = document.getElementById('watermark-controls');
    const wmPreview = document.getElementById('watermark-preview');
    const wmList = document.getElementById('watermark-list');
    const wmText = document.getElementById('watermark-text');
    const btnWatermarkPdf = document.getElementById('btn-watermark-pdf');
    
    let fileToWatermark = null;

    wmDropzone.addEventListener('click', () => wmInput.click());
    wmDropzone.addEventListener('dragover', (e) => { e.preventDefault(); wmDropzone.classList.add('dragover'); });
    wmDropzone.addEventListener('dragleave', () => wmDropzone.classList.remove('dragover'));
    
    wmDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        wmDropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
            const isImg = file.type.startsWith('image/') || /\.(png|jpe?g)$/i.test(file.name);
            if (isPdf || isImg) {
                handleWatermarkFile(file);
            }
        }
    });

    wmInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleWatermarkFile(e.target.files[0]);
    });

    function handleWatermarkFile(file) {
        const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
        const isImg = file.type.startsWith('image/') || /\.(png|jpe?g)$/i.test(file.name);
        
        if (!isPdf && !isImg) {
            alert('Please select a valid PDF or Image file.');
            return;
        }

        fileToWatermark = file;
        wmList.innerHTML = '';
        
        const div = document.createElement('div');
        div.className = 'img-preview-item';
        div.style.background = '#e2e8f0';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.flexDirection = 'column';
        div.style.padding = '10px';
        
        const icon = document.createElement('i');
        if (isPdf) {
            icon.className = 'fa-solid fa-file-pdf';
            icon.style.color = 'var(--primary)';
        } else {
            icon.className = 'fa-solid fa-file-image';
            icon.style.color = '#3b82f6';
        }
        icon.style.fontSize = '2rem';
        
        const text = document.createElement('span');
        text.textContent = file.name;
        text.style.fontSize = '0.7rem';
        text.style.marginTop = '10px';
        text.style.wordBreak = 'break-all';
        text.style.textAlign = 'center';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-img-btn';
        removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            fileToWatermark = null;
            wmPreview.style.display = 'none';
            wmControls.style.display = 'none';
            btnWatermarkPdf.disabled = true;
            wmInput.value = '';
        };
        
        div.appendChild(icon);
        div.appendChild(text);
        div.appendChild(removeBtn);
        wmList.appendChild(div);

        wmPreview.style.display = 'block';
        wmControls.style.display = 'block';
        btnWatermarkPdf.disabled = false;
    }

    btnWatermarkPdf.addEventListener('click', async () => {
        if (!fileToWatermark) return;
        
        const text = wmText.value.trim();
        if (!text) {
            wmText.classList.add('error-blink');
            wmText.focus();
            setTimeout(() => {
                wmText.classList.remove('error-blink');
            }, 1200);
            return;
        }
        
        const btnText = btnWatermarkPdf.querySelector('span');
        const spinner = btnWatermarkPdf.querySelector('.spinner');
        
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        btnWatermarkPdf.disabled = true;

        try {
            // Add a realistic 1.5s artificial delay for a premium experience
            await new Promise(resolve => setTimeout(resolve, 1500));

            const isPdf = fileToWatermark.type === 'application/pdf' || /\.pdf$/i.test(fileToWatermark.name);
            let blob;
            if (isPdf) {
                const { PDFDocument, rgb, degrees } = window.PDFLib;
                const arrayBuffer = await fileToWatermark.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const pages = pdfDoc.getPages();
                
                pages.forEach(page => {
                    const { width, height } = page.getSize();
                    page.drawText(text, {
                        x: width / 4,
                        y: height / 2,
                        size: Math.max(20, Math.floor(width / 12)),
                        color: rgb(0.5, 0.5, 0.5),
                        opacity: 0.3,
                        rotate: degrees(45),
                    });
                });
                const pdfBytes = await pdfDoc.save();
                blob = new Blob([pdfBytes], { type: 'application/pdf' });
            } else {
                // It is an image file!
                const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(fileToWatermark);
                });

                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = dataUrl;
                });

                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Add watermark
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(-45 * Math.PI / 180);
                const fontSize = Math.max(24, Math.floor(canvas.width / 12));
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, 0, 0);
                ctx.restore();

                blob = await new Promise(resolve => canvas.toBlob(resolve, fileToWatermark.type || 'image/jpeg', 0.9));
            }

            showPDFResultCard('watermark-pdf', blob, `watermarked_${fileToWatermark.name}`, () => {
                fileToWatermark = null;
                wmPreview.style.display = 'none';
                wmControls.style.display = 'none';
                wmText.value = '';
                wmInput.value = '';
                btnWatermarkPdf.disabled = true;
            });
            
        } catch (error) {
            console.error('Watermark Error:', error);
            alert('An error occurred while adding watermark.');
        } finally {
            btnText.style.display = 'block';
            spinner.style.display = 'none';
            btnWatermarkPdf.disabled = false;
        }
    });

    // ==========================================
    // PREMIUM DOWNLOAD SUCCESS TOAST
    // ==========================================
    function showDownloadSuccessPopup(fileName) {
        // Remove existing toast if present to prevent stacking
        let existingToast = document.getElementById('download-success-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.id = 'download-success-toast';
        toast.className = 'download-toast';
        document.body.appendChild(toast);

        // Clean filename for display (remove paths/etc if any)
        const displayName = fileName.split('/').pop().split('\\').pop();

        toast.innerHTML = `
            <div class="download-toast-icon">
                <i class="fa-solid fa-circle-check"></i>
            </div>
            <div class="download-toast-content">
                <h4 class="download-toast-title">File Downloaded Successfully</h4>
                <p class="download-toast-msg">
                    The file <strong>${displayName}</strong> has been successfully saved. You can find it in your device storage or Download History.
                </p>
            </div>
            <button class="download-toast-close" title="Close">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        // Slide in
        setTimeout(() => {
            toast.classList.add('show');
        }, 50);

        // Auto dismiss after 6 seconds
        const dismissTimeout = setTimeout(() => {
            closeToast();
        }, 6000);

        const closeToast = () => {
            clearTimeout(dismissTimeout);
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        };

        // Close on clicking close button or toast itself
        const closeBtn = toast.querySelector('.download-toast-close');
        if (closeBtn) closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeToast();
        });
        toast.addEventListener('click', closeToast);
    }

    // ==========================================
    // RESULT PREVIEW & DOWNLOAD / SHARE CARD
    // ==========================================
    function showPDFResultCard(sectionId, blob, defaultFileName, resetCallback, customDownloadCallback) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        let existingResult = section.querySelector('.pdf-result-card');
        if (existingResult) {
            existingResult.remove();
        }

        const resultCard = document.createElement('div');
        resultCard.className = 'pdf-result-card';
        resultCard.style.cssText = `
            margin-top: 1.5rem;
            padding: 1.5rem;
            border: 2px dashed var(--border);
            border-radius: var(--radius);
            background: var(--card-bg);
            text-align: center;
            box-shadow: var(--shadow-sm);
            animation: fadeIn 0.3s ease;
        `;
        const blobUrl = URL.createObjectURL(blob);
        const isPdf = blob.type === 'application/pdf';
        const titleText = isPdf ? 'Your PDF is Ready!' : 'Your File is Ready!';
        const btnText = isPdf ? 'Download PDF' : 'Download File';

        resultCard.innerHTML = `
            <div style="font-size: 2.2rem; color: var(--success); margin-bottom: 0.5rem;">
                <i class="fa-solid fa-circle-check"></i>
            </div>
            <h3 style="font-size: 1.2rem; margin-bottom: 0.25rem; color: var(--text-main);">${titleText}</h3>
            <p class="pdf-file-address" style="font-size: 0.8rem; color: var(--text-muted); word-break: break-all; margin-bottom: 1.5rem; font-family: monospace; background: var(--bg-color); padding: 0.5rem; border-radius: 6px;">
                ${blobUrl}
            </p>
            <div class="result-actions" style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; flex-wrap: wrap;">
                <button class="btn btn-erase" style="min-width: auto; padding: 0.75rem 1.5rem; background: #ef4444; color: white; border-radius: 8px; font-size: 1rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: var(--transition);">
                    <i class="fa-solid fa-trash-can"></i> Erase
                </button>
                <button class="btn btn-download" style="min-width: auto; padding: 0.8rem 2.5rem; background: var(--primary); color: white; border-radius: 8px; font-size: 1.1rem; font-weight: 700; flex: 1.5; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: var(--transition);">
                    <i class="fa-solid fa-download"></i> ${btnText}
                </button>
                <button class="btn btn-share" style="min-width: auto; padding: 0.75rem 1.5rem; background: #0ea5e9; color: white; border-radius: 8px; font-size: 1rem; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: var(--transition);">
                    <i class="fa-solid fa-share-nodes"></i> Share
                </button>
            </div>
        `;

        const actionsDiv = section.querySelector('.actions');
        if (actionsDiv) {
            actionsDiv.parentNode.insertBefore(resultCard, actionsDiv.nextSibling);
        }

        const btnErase = resultCard.querySelector('.btn-erase');
        const btnDownload = resultCard.querySelector('.btn-download');
        const btnShare = resultCard.querySelector('.btn-share');

        if (btnErase) {
            btnErase.addEventListener('mouseover', () => btnErase.style.opacity = '0.85');
            btnErase.addEventListener('mouseout', () => btnErase.style.opacity = '1');
            btnErase.addEventListener('click', () => {
                resultCard.remove();
                if (resetCallback) resetCallback();
                URL.revokeObjectURL(blobUrl);
            });
        }

        if (btnDownload) {
            btnDownload.addEventListener('mouseover', () => btnDownload.style.opacity = '0.9');
            btnDownload.addEventListener('mouseout', () => btnDownload.style.opacity = '1');
            btnDownload.addEventListener('click', async () => {
                btnDownload.disabled = true;
                btnDownload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparing...';
                
                // Wait 1.2 seconds for realistic loading
                await new Promise(resolve => setTimeout(resolve, 1200));

                if (customDownloadCallback) {
                    try {
                        await customDownloadCallback();
                    } catch (err) {
                        console.error('Custom download error:', err);
                    }
                } else {
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = defaultFileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
                
                btnDownload.disabled = false;
                btnDownload.innerHTML = '<i class="fa-solid fa-circle-check"></i> Downloaded';
                btnDownload.style.background = '#10b981'; // Success green background
                
                // Show success modal popup
                showDownloadSuccessPopup(defaultFileName);
            });
        }
        btnShare.addEventListener('click', async () => {
            btnShare.disabled = true;
            const originalHTML = btnShare.innerHTML;
            btnShare.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sharing...';

            try {
                const file = new File([blob], defaultFileName, { type: blob.type || 'application/pdf' });
                if (navigator.share) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'Share PDF - Toolifiy',
                            text: 'Here is my generated PDF document!'
                        });
                        return;
                    } catch (shareErr) {
                        console.log('File sharing error, trying text/URL share:', shareErr);
                        try {
                            await navigator.share({
                                title: 'Toolifiy PDF Toolkit',
                                text: 'I generated a PDF document using Toolifiy!',
                                url: window.location.href
                            });
                            return;
                        } catch (textShareErr) {
                            console.log('All sharing methods failed:', textShareErr);
                        }
                    }
                }
                
                // Fallback direct download
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = defaultFileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                alert("Native file sharing is not supported in this environment/browser (requires HTTPS). The file has been downloaded instead so you can send it manually.");
            } catch (err) {
                console.error('Share failed:', err);
            } finally {
                btnShare.disabled = false;
                btnShare.innerHTML = originalHTML;
            }
        });
    }

});
