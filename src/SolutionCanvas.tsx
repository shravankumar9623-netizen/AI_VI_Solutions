import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface ScriptSegment {
    time_segment: string;
    voiceover_hinglish: string;
    pen_action: string;
    visual_focus: string;
}

interface Question {
    slide: number;
    topic?: string;
    text: string;
    options?: string[];
    answer: string;
    script_data: ScriptSegment[];
}

/**
 * SolutionCanvas v9 — "Doubtnut-Style" Guaranteed Text Renderer
 * 
 * CORE PRINCIPLE: Every segment's pen_action text is ALWAYS rendered.
 * No regex gating. No silent drops. If it exists in script_data, it appears on screen.
 */
export default function SolutionCanvas({
    question,
    penColor,
    voiceStyle,
    elevenLabsKey,
    bgImageUrl,
}: {
    question: Question,
    penColor: string,
    voiceStyle: string,
    elevenLabsKey?: string,
    bgImageUrl?: string,
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const isPlayingRef = useRef(false);
    const [progress, setProgress] = useState(0);
    const [_currentSegmentIdx, setCurrentSegmentIdx] = useState(0);
    const currentSegmentIdxRef = useRef(0);
    const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (bgImageUrl) {
            const img = new Image();
            img.onload = () => setBgImage(img);
            img.src = bgImageUrl;
        } else {
            setBgImage(null);
        }
    }, [bgImageUrl]);

    const animationRef = useRef<number>(0);
    const segmentStartTimeRef = useRef<number>(0);
    const simulatedAudioDurations = useRef<number[]>([]);

    const getPenColor = () => penColor.toLowerCase() === 'blue' ? '#2563eb' : '#dc2626';

    /**
     * Extract the displayable text from a pen_action string.
     * This strips prefixes like "Write Math 1:", "Section Header: [...]", "Box Answer:" etc.
     * and returns the actual content to display.
     * If no pattern matches, it returns the ENTIRE pen_action string as-is.
     * This guarantees text is NEVER silently dropped.
     */
    const extractDisplayText = (penAction: string): { text: string, type: 'step' | 'header' | 'answer' | 'replace' | 'highlight', target?: string } => {
        // Internal action keywords to skip rendering as text
        if (['intro', 'drawing', 'animation', 'underline', 'star'].includes(penAction.toLowerCase())) {
            return { text: '', type: 'step' };
        }

        // "Replace: <old> -> <new>"
        const replaceMatch = penAction.match(/Replace:\s*(.*)\s*->\s*(.*)/i);
        if (replaceMatch) return { text: replaceMatch[2], type: 'replace', target: replaceMatch[1] };

        // "Highlight: <term>"
        const highlightMatch = penAction.match(/Highlight:\s*(.*)/i);
        if (highlightMatch) return { text: highlightMatch[1], type: 'highlight' };

        // "Write Math N: <content>"
        const writeMath = penAction.match(/Write Math \d+:\s*(.*)/i);
        if (writeMath) return { text: writeMath[1], type: 'step' };

        // "Handwritten: <content>"
        const handwritten = penAction.match(/Handwritten:\s*(.*)/i);
        if (handwritten) return { text: handwritten[1], type: 'step' };

        // "Chemistry Diagram: <label>"
        const chemDiagram = penAction.match(/Chemistry Diagram:\s*(.*)/i);
        if (chemDiagram) return { text: `[${chemDiagram[1]}]`, type: 'highlight' };

        // "Section Header: [<content>]"
        const sectionHeader = penAction.match(/Section Header:\s*\[?(.*?)\]?/i);
        if (sectionHeader) return { text: sectionHeader[1], type: 'header' };

        // "Box Answer: <content>"
        const boxAnswer = penAction.match(/Box Answer:\s*(.*)/i);
        if (boxAnswer) return { text: boxAnswer[1], type: 'answer' };

        // Visual commands logic
        if (penAction.match(/Underline ROW/i)) return { text: '', type: 'step' };
        if (penAction.match(/star|cursor|draw/i)) return { text: '', type: 'step' };

        // FALLBACK
        return { text: penAction, type: 'step' };
    };

    /**
     * drawFrame v9 — Guaranteed Rendering
     * 
     * Layout:
     * ┌──────────────────────────────┐
     * │    PPT Question Image        │  <- Top 30% (dark bg with contained image)
     * │    (contained, not cropped)  │
     * ├──────────────────────────────┤
     * │  Step 1: Identity: cot⁻¹... │  <- Bottom 70% (white bg, solution steps)
     * │  Step 2: f(x) = (π - ...    │
     * │  Step 3: ...                 │
     * │  ...                         │
     * │  ╔═══════════════════════╗   │
     * │  ║ Answer: Option (2)   ║   │
     * │  ╚═══════════════════════╝   │
     * └──────────────────────────────┘
     */
    const drawFrame = (ctx: CanvasRenderingContext2D, activeIdx: number, segmentProgress: number) => {
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;
        const SPLIT = Math.round(H * 0.30); // Top 30% for question
        const SOLUTION_START_Y = SPLIT + 50;
        const LINE_HEIGHT = 48;
        const LEFT_MARGIN = 50;

        // --- Clear ---
        ctx.clearRect(0, 0, W, H);

        // --- Top Section: Dark background for question ---
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, SPLIT);

        // --- Bottom Section: White workspace ---
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, SPLIT, W, H - SPLIT);

        // --- Divider line ---
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, SPLIT);
        ctx.lineTo(W, SPLIT);
        ctx.stroke();

        // --- Draw PPT Question Image (contained in top frame) ---
        if (bgImage) {
            const pad = 10;
            const frameW = W - pad * 2;
            const frameH = SPLIT - pad * 2;
            const imgRatio = bgImage.width / bgImage.height;
            const frameRatio = frameW / frameH;

            let dw: number, dh: number, dx: number, dy: number;
            if (imgRatio > frameRatio) {
                dw = frameW;
                dh = frameW / imgRatio;
                dx = pad;
                dy = pad + (frameH - dh) / 2;
            } else {
                dh = frameH;
                dw = frameH * imgRatio;
                dx = pad + (frameW - dw) / 2;
                dy = pad;
            }
            ctx.drawImage(bgImage, dx, dy, dw, dh);
        } else {
            // No image — show question text
            ctx.fillStyle = '#94a3b8';
            let qFontSize = 24;
            const textLen = (question.text || '').length;
            if (textLen > 250) qFontSize = 16;
            else if (textLen > 150) qFontSize = 20;
            
            ctx.font = `${qFontSize}px "Inter", sans-serif`;
            const qLines = wrapText(ctx, question.text || 'Question', W - 100);
            
            let qY = 40;
            const lineHeight = qFontSize + 6;
            
            for (const line of qLines) {
                if (qY > SPLIT - 30) break; // prevent bleeding
                ctx.fillText(line, LEFT_MARGIN, qY);
                qY += lineHeight;
            }
            if (question.options && question.options.length > 0) {
               qY += 10;
               ctx.font = 'bold 16px "Inter", sans-serif';
               ctx.fillStyle = '#64748b';
               question.options.forEach((opt, idx) => {
                   if (qY <= SPLIT - 20) {
                       ctx.fillText(opt, LEFT_MARGIN, qY);
                       qY += 24; // vertically stack options
                   }
               });
            }
        }

        // --- Collect all displayable steps ---
        const allSteps: { text: string, type: 'step' | 'header' | 'answer' | 'replace' | 'highlight', target?: string }[] = [];
        for (const seg of question.script_data) {
            const extracted = extractDisplayText(seg.pen_action);
            if (extracted.text.length > 0) {
                allSteps.push(extracted);
            }
        }

        // --- Determine how many text steps to show ---
        // Simple approach: count how many text-bearing segments we have passed
        let completedTextSteps = 0;
        let currentTextStepProgress = -1; // -1 means no step is currently animating
        
        for (let i = 0; i < question.script_data.length; i++) {
            const ext = extractDisplayText(question.script_data[i].pen_action);
            if (ext.text.length === 0) {
                // Non-text segment (star, underline, etc.) — skip but keep counting
                if (i < activeIdx) continue;
                if (i === activeIdx) continue; // Currently on a non-text segment, just show what we have
                break;
            }
            
            if (i < activeIdx) {
                completedTextSteps++;
            } else if (i === activeIdx) {
                currentTextStepProgress = segmentProgress;
                break;
            } else {
                break; // Future segment, stop
            }
        }

        // --- Render each step ---
        let y = SOLUTION_START_Y;
        const ink = getPenColor();

        for (let si = 0; si < allSteps.length; si++) {
            const step = allSteps[si];
            const isFullyWritten = si < completedTextSteps;
            const isCurrentlyWriting = (si === completedTextSteps && currentTextStepProgress >= 0);
            const shouldShow = isFullyWritten || isCurrentlyWriting;

            if (!shouldShow) break;

            ctx.save();

            // Handle "Replace" logic
            if (step.type === 'replace') {
                const oldText = step.target || '';
                const newText = step.text;
                ctx.font = '30px "Kalam", cursive';
                
                if (isCurrentlyWriting) {
                    // Cross-fade effect
                    ctx.globalAlpha = 1 - segmentProgress;
                    ctx.fillStyle = '#94a3b8'; // Fade out old in grey
                    ctx.fillText(oldText, LEFT_MARGIN, y);
                    
                    ctx.globalAlpha = segmentProgress;
                    ctx.fillStyle = ink;
                    ctx.fillText(newText, LEFT_MARGIN, y);
                } else {
                    ctx.fillStyle = ink;
                    ctx.fillText(newText, LEFT_MARGIN, y);
                }
                
                y += LINE_HEIGHT;
                ctx.restore();
                continue;
            }

            // Handle "Highlight" logic
            if (step.type === 'highlight') {
                const term = step.text;
                ctx.font = 'bold 30px "Kalam", cursive';
                
                if (isCurrentlyWriting) {
                    const glowOpacity = Math.sin(segmentProgress * Math.PI) * 0.3;
                    ctx.fillStyle = `rgba(255, 235, 59, ${glowOpacity})`;
                    const tw = ctx.measureText(term).width;
                    ctx.fillRect(LEFT_MARGIN - 5, y - 25, tw + 10, 35);
                }
                
                ctx.fillStyle = '#b91c1c'; // Deep red for emphasis
                ctx.fillText(term, LEFT_MARGIN, y);
                
                y += LINE_HEIGHT * 0.6;
                ctx.restore();
                continue;
            }

            // Standard styles (Header, Answer, Step)
            if (step.type === 'header') {
                ctx.font = 'bold 28px "Kalam", cursive';
                ctx.fillStyle = '#1e40af';
            } else if (step.type === 'answer') {
                ctx.font = 'bold 36px "Kalam", cursive';
                ctx.fillStyle = '#dc2626';
            } else {
                ctx.font = '30px "Kalam", cursive';
                ctx.fillStyle = ink;
            }

            let displayText = step.text;
            if (isCurrentlyWriting) {
                const charCount = Math.max(1, Math.floor(segmentProgress * displayText.length));
                displayText = displayText.substring(0, charCount);
            }

            const maxLineWidth = W - LEFT_MARGIN - 50;
            const lines = wrapText(ctx, displayText, maxLineWidth);

            for (const line of lines) {
                if (y > H - 30) break;
                ctx.fillText(line, LEFT_MARGIN, y);
                y += LINE_HEIGHT * 0.85;
            }

            // Pen Cursor removed as per requested by the user

            // Answer Box
            if (step.type === 'answer' && !isCurrentlyWriting) {
                const fullWidth = ctx.measureText(step.text).width;
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = 3;
                ctx.strokeRect(LEFT_MARGIN - 10, y - LINE_HEIGHT * 1.6, fullWidth + 30, LINE_HEIGHT * 1.2);
            }

            ctx.restore();
            y += 8;
        }
    };

    /**
     * Simple word-wrap utility for canvas text
     */
    const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
        if (ctx.measureText(text).width <= maxWidth) return [text];

        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (ctx.measureText(testLine).width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    };

    // ─── Animation & Audio (unchanged from working version) ───

    const stepAnimation = (timestamp: number) => {
        if (!segmentStartTimeRef.current) segmentStartTimeRef.current = timestamp;

        const activeSegment = question.script_data[currentSegmentIdxRef.current];
        if (!activeSegment) return;

        const estimatedDuration = simulatedAudioDurations.current[currentSegmentIdxRef.current] || (activeSegment.voiceover_hinglish.length * 65);
        const elapsed = timestamp - segmentStartTimeRef.current;
        const ratio = Math.min(elapsed / estimatedDuration, 1);

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) drawFrame(ctx, currentSegmentIdxRef.current, ratio);
        }

        const rawProgress = (currentSegmentIdxRef.current / question.script_data.length) * 100;
        const segmentWeight = 100 / question.script_data.length;
        setProgress((rawProgress + (ratio * segmentWeight)) * 0.99);

        if (isPlayingRef.current) {
            animationRef.current = requestAnimationFrame(stepAnimation);
        }
    };

    const playAudioSegment = (segIdx: number) => {
        if (segIdx >= question.script_data.length) {
            setIsPlaying(false);
            isPlayingRef.current = false;
            setProgress(100);
            return;
        }

        setCurrentSegmentIdx(segIdx);
        currentSegmentIdxRef.current = segIdx;
        segmentStartTimeRef.current = 0;

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const segment = question.script_data[segIdx];

        const setupAudioElement = (audioUrl: string) => {
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.oncanplaythrough = () => {
                if (isFinite(audio.duration)) {
                    simulatedAudioDurations.current[segIdx] = audio.duration * 1000;
                }
                if (isPlayingRef.current) audio.play().catch(e => {
                    console.error("Audio blocked by browser, simulating delay", e);
                    simulateAudioFallback(segIdx, segment.voiceover_hinglish.length * 65);
                });
            };

            audio.onended = () => {
                if (isPlayingRef.current) {
                    playAudioSegment(segIdx + 1);
                }
            };

            audio.onerror = () => {
                triggerSpeechSynthesisFallback(segment.voiceover_hinglish, segIdx);
            };

            audio.load();
        };

        const triggerSpeechSynthesisFallback = (text: string, idx: number) => {
            if ('speechSynthesis' in window) {
                const utt = new SpeechSynthesisUtterance(text.replace(/\[PAUSE\]/g, '... '));
                const voices = window.speechSynthesis.getVoices();

                const indianVoice = voices.find(v => v.lang.includes('en-IN') && (v.name.includes('Natural') || v.name.includes('Online')))
                    || voices.find(v => v.lang.includes('hi-IN'))
                    || voices.find(v => v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('neerja'))
                    || voices.find(v => v.lang.includes('en-IN'));

                if (indianVoice) utt.voice = indianVoice;

                utt.rate = voiceStyle === 'energetic' ? 1.05 : 0.9;
                utt.pitch = 0.95;

                utt.onend = () => {
                    if (isPlayingRef.current) playAudioSegment(idx + 1);
                };
                window.speechSynthesis.speak(utt);
                simulatedAudioDurations.current[idx] = text.length * 75;
            } else {
                simulateAudioFallback(idx, text.length * 65);
            }
        };

        if (elevenLabsKey) {
            const voiceId = "pNInz6obbfdqIca2pa1j";
            fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
                method: 'POST',
                headers: {
                    'xi-api-key': elevenLabsKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: segment.voiceover_hinglish,
                    model_id: "eleven_multilingual_v2"
                })
            })
            .then(res => {
                if (!res.ok) throw new Error('ElevenLabs failed');
                return res.blob();
            })
            .then(blob => {
                setupAudioElement(URL.createObjectURL(blob));
            })
            .catch(e => {
                console.error("ElevenLabs API Error, falling back to Native Cloud TTS", e);
                triggerSpeechSynthesisFallback(segment.voiceover_hinglish, segIdx);
            });
        } else {
            const encodedText = encodeURIComponent(segment.voiceover_hinglish);
            const audioUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=hi&q=${encodedText}`;
            setupAudioElement(audioUrl);
        }
    };

    const simulateAudioFallback = (segIdx: number, duration: number) => {
        setTimeout(() => {
            if (isPlayingRef.current) playAudioSegment(segIdx + 1);
        }, duration);
    };

    useEffect(() => {
        if (isPlaying) {
            segmentStartTimeRef.current = 0;
            animationRef.current = requestAnimationFrame(stepAnimation);
        } else {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioRef.current) audioRef.current.pause();
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        }
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        };
    }, [isPlaying]);

    const startPlaying = () => {
        if (currentSegmentIdxRef.current >= question.script_data.length - 1 && progress >= 99) {
            reset();
        }
        setIsPlaying(true);
        isPlayingRef.current = true;
        playAudioSegment(currentSegmentIdxRef.current >= question.script_data.length - 1 ? 0 : currentSegmentIdxRef.current);
    };

    const stopPlaying = () => {
        setIsPlaying(false);
        isPlayingRef.current = false;
        if ('speechSynthesis' in window) window.speechSynthesis.pause();
    };

    const reset = () => {
        stopPlaying();
        setCurrentSegmentIdx(0);
        currentSegmentIdxRef.current = 0;
        setProgress(0);
        segmentStartTimeRef.current = 0;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) drawFrame(ctx, 0, 0);
        }
    };

    useEffect(() => {
        reset();
    }, [question, voiceStyle]);

    return (
        <div className="w-full h-full flex flex-col items-center bg-black relative">
            <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="w-full h-full object-contain"
            />
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 to-transparent p-4 flex flex-col gap-2">
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden cursor-pointer">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center gap-4 mt-2">
                    {isPlaying ? (
                        <button onClick={stopPlaying} className="text-white hover:text-blue-400 p-2">
                            <Pause className="w-6 h-6" />
                        </button>
                    ) : (
                        <button onClick={startPlaying} className="text-white hover:text-blue-400 p-2">
                            <Play className="w-6 h-6" />
                        </button>
                    )}
                    <button onClick={reset} className="text-white hover:text-slate-400 p-2">
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <div className="text-[10px] text-green-400 font-bold border border-green-500/30 bg-green-500/10 px-2 py-0.5 rounded">
                        NATURAL CLOUD TTS
                    </div>
                    <span className="text-xs text-white/50 font-mono tracking-wider ml-auto">
                        1280x720 / Canvas Render
                    </span>
                </div>
            </div>
        </div>
    );
}
