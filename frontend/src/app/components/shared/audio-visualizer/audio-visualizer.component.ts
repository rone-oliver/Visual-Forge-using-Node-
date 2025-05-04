import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-audio-visualizer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-visualizer.component.html',
  styleUrl: './audio-visualizer.component.scss'
})
export class AudioVisualizerComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() audioElement!: HTMLAudioElement;
  @ViewChild('visualizerCanvas') visualizerCanvasRef!: ElementRef<HTMLCanvasElement>;

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private canvas!: HTMLCanvasElement;
  private canvasContext: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private isInitialized = false;
  private useFallbackVisualization = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.canvas = this.visualizerCanvasRef.nativeElement;
    this.canvasContext = this.canvas.getContext('2d');
    
    // Set up canvas dimensions
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width || 300; // Fallback width if rect is 0
    this.canvas.height = rect.height || 80; // Fallback height if rect is 0
    
    // Initialize if audio element is already available
    if (this.audioElement && this.canvasContext) {
      console.log('Audio element available in AfterViewInit, initializing visualizer');
      this.initializeVisualizer();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    // React to changes in the audioElement input
    if (changes['audioElement'] && changes['audioElement'].currentValue) {
      console.log('Audio element changed in OnChanges:', this.audioElement);
      
      // Wait for next change detection cycle to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        if (this.canvasContext && !this.isInitialized && this.audioElement) {
          this.initializeVisualizer();
        }
      });
    }
  }

  private initializeVisualizer(): void {
    if (this.isInitialized || !this.audioElement) return;
    
    console.log('Initializing audio visualizer with element:', this.audioElement);
    try {
      this.setupAudioContext();
      this.setupEventListeners();
      this.isInitialized = true;
      this.cdr.detectChanges(); // Manually trigger change detection
    } catch (error) {
      console.error('Failed to initialize visualizer:', error);
    }
  }

  private setupAudioContext(): void {
    try {
      if (!this.audioElement) {
        console.error('Cannot setup audio context: audioElement is null');
        return;
      }
      
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      
      // Configure the analyser - use higher FFT size for more data points in circle
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      try {
        // Create media element source
        this.source = this.audioContext.createMediaElementSource(this.audioElement);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        console.log('Audio context setup complete');
      } catch (e) {
        console.error('CORS error detected, using fallback visualization:', e);
        // Set a flag to use fallback visualization
        this.useFallbackVisualization = true;
        
        // Initialize with dummy data for visualization
        this.dataArray = new Uint8Array(128);
        for (let i = 0; i < this.dataArray.length; i++) {
          this.dataArray[i] = 0;
        }
      }
    } catch (error) {
      console.error('Error setting up audio context:', error);
    }
  }
  
  private setupEventListeners(): void {
    if (!this.audioElement) return;
    
    // Add event listeners to handle play/pause
    this.audioElement.addEventListener('play', () => {
      console.log('Audio playing - starting visualization');
      if (this.audioContext?.state === 'suspended') {
        this.audioContext.resume();
      }
      this.visualize();
    });
    
    this.audioElement.addEventListener('pause', () => {
      console.log('Audio paused - stopping visualization');
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    });
    
    this.audioElement.addEventListener('ended', () => {
      console.log('Audio ended - stopping visualization');
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    });
  }

  private visualize(): void {
    if (!this.canvasContext || !this.dataArray) return;
  
    this.animationFrameId = requestAnimationFrame(() => this.visualize());
    
    if (!this.useFallbackVisualization && this.analyser) {
      // Use real audio data if available
      this.analyser.getByteFrequencyData(this.dataArray);
    } else {
      // Use fallback animation based on audio currentTime
      this.generateFallbackVisualization();
    }
  
    // Clear canvas completely first
    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Use a more visible background
    this.canvasContext.fillStyle = 'rgba(30, 30, 30, 0.2)';
    this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw circular visualizer
    this.drawCircularVisualizer();
  }
  
  private drawCircularVisualizer(): void {
    if (!this.canvasContext || !this.dataArray) return;
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Determine the maximum radius based on the canvas size
    const maxRadius = Math.min(centerX, centerY) * 0.9;
    const minRadius = maxRadius * 0.2; // Inner circle size
    
    // Draw background center circle
    this.canvasContext.beginPath();
    this.canvasContext.arc(centerX, centerY, minRadius, 0, 2 * Math.PI);
    this.canvasContext.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.canvasContext.fill();
    
    // Use only a portion of the frequency data for better visualization
    const totalBars = 180; // Number of data points to use (for smooth circle)
    const step = Math.floor(this.dataArray.length / totalBars);
    
    for (let i = 0; i < totalBars; i++) {
      // Get data value
      const dataIndex = i * step;
      const value = this.dataArray[dataIndex];
      
      // Skip very low values
      if (value < 5) continue;
      
      // Calculate the normalized value (0-1)
      const normalizedValue = value / 255;
      
      // Calculate radius based on frequency value
      const radius = minRadius + (normalizedValue * (maxRadius - minRadius));
      
      // Calculate angle for this bar
      const angle = (i / totalBars) * (2 * Math.PI);
      
      // Calculate start and end points
      const innerX = centerX + minRadius * Math.cos(angle);
      const innerY = centerY + minRadius * Math.sin(angle);
      const outerX = centerX + radius * Math.cos(angle);
      const outerY = centerY + radius * Math.sin(angle);
      
      // Set line style
      const hue = (i / totalBars) * 360;
      this.canvasContext.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      this.canvasContext.lineWidth = 2;
      
      // Draw line
      this.canvasContext.beginPath();
      this.canvasContext.moveTo(innerX, innerY);
      this.canvasContext.lineTo(outerX, outerY);
      this.canvasContext.stroke();
      
      // Add circular caps at the end of lines for aesthetic appeal
      if (normalizedValue > 0.1) { // Only draw for significant values
        this.canvasContext.beginPath();
        this.canvasContext.arc(outerX, outerY, 2, 0, 2 * Math.PI);
        this.canvasContext.fillStyle = `hsl(${hue}, 100%, 70%)`;
        this.canvasContext.fill();
      }
    }
    
    // Optional: add a pulsing effect to the center circle based on low frequencies
    if (this.dataArray.length > 0) {
      const bassValue = this.dataArray[0] / 255; // Use the lowest frequency
      const pulseRadius = minRadius * (1 + bassValue * 0.3);
      
      this.canvasContext.beginPath();
      this.canvasContext.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
      this.canvasContext.fillStyle = `rgba(255, 255, 255, ${bassValue * 0.5})`;
      this.canvasContext.fill();
    }
  }
  
  // Add this method for fallback visualization
  private generateFallbackVisualization(): void {
    if (!this.audioElement || !this.dataArray) return;
    
    // Generate visualization based on current time and duration
    const currentTime = this.audioElement.currentTime || 0;
    const duration = this.audioElement.duration || 1;
    const playbackProgress = currentTime / duration;
    
    // Create a wave-like pattern
    for (let i = 0; i < this.dataArray.length; i++) {
      // Base amplitude that increases with playback progress
      const baseAmplitude = 30 + (playbackProgress * 40);
      
      // Create a wave pattern
      const wave1 = Math.sin((currentTime * 5) + (i * 0.2)) * baseAmplitude;
      const wave2 = Math.sin((currentTime * 3) + (i * 0.1)) * baseAmplitude * 0.5;
      
      // Combine waves and ensure positive values
      this.dataArray[i] = Math.abs(wave1 + wave2) + 10;
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.isInitialized = false;
  }
}