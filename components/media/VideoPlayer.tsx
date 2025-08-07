import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { 
  IconButton, 
  Text, 
  Surface, 
  Slider, 
  Button,
  Menu,
  Portal,
  Modal
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { VideoService } from '../../services/VideoService';
import { useMediaCache } from '../../hooks/useMediaCache';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface VideoPlayerProps {
  // Fonte do vídeo
  uri?: string;
  videoPath?: string;
  bucket?: string;
  
  // Configurações de reprodução
  shouldPlay?: boolean;
  isLooping?: boolean;
  volume?: number;
  rate?: number;
  resizeMode?: ResizeMode;
  
  // Controles
  showControls?: boolean;
  autoHideControls?: boolean;
  controlsTimeout?: number;
  
  // Qualidade adaptativa
  enableQualitySelector?: boolean;
  availableQualities?: Array<{
    label: string;
    value: string;
    uri: string;
  }>;
  
  // Funcionalidades
  enableFullscreen?: boolean;
  enablePictureInPicture?: boolean;
  enableSeekPreview?: boolean;
  
  // Callbacks
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
  onFullscreenUpdate?: (fullscreen: boolean) => void;
  onLoad?: (status: AVPlaybackStatus) => void;
  onError?: (error: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  uri,
  videoPath,
  bucket = 'exercise-videos',
  shouldPlay = false,
  isLooping = false,
  volume = 1.0,
  rate = 1.0,
  resizeMode = ResizeMode.CONTAIN,
  showControls = true,
  autoHideControls = true,
  controlsTimeout = 3000,
  enableQualitySelector = true,
  availableQualities = [
    { label: '480p', value: 'low', uri: '' },
    { label: '720p', value: 'medium', uri: '' },
    { label: '1080p', value: 'high', uri: '' }
  ],
  enableFullscreen = true,
  enablePictureInPicture = false,
  enableSeekPreview = false,
  onPlaybackStatusUpdate,
  onFullscreenUpdate,
  onLoad,
  onError
}) => {
  // Estado do player
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(shouldPlay);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado dos controles
  const [controlsVisible, setControlsVisible] = useState(showControls);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [playbackRate, setPlaybackRate] = useState(rate);
  const [selectedQuality, setSelectedQuality] = useState('medium');
  
  // Estado da interface
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  // Refs
  const videoRef = useRef<Video>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cache de mídia
  const { getMedia } = useMediaCache();
  
  // Animações
  const controlsOpacity = useSharedValue(showControls ? 1 : 0);

  // URI do vídeo atual
  const [currentUri, setCurrentUri] = useState<string>('');

  // Carregar URI do vídeo
  useEffect(() => {
    loadVideoUri();
  }, [uri, videoPath, bucket, selectedQuality]);

  // Auto-hide dos controles
  useEffect(() => {
    if (autoHideControls && controlsVisible && isPlaying) {
      resetControlsTimeout();
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [controlsVisible, isPlaying, autoHideControls]);

  // Sincronizar estado de reprodução
  useEffect(() => {
    setIsPlaying(shouldPlay);
  }, [shouldPlay]);

  const loadVideoUri = async () => {
    try {
      let videoUri = '';
      
      if (uri) {
        videoUri = uri;
      } else if (videoPath && bucket) {
        // Carregar do cache ou baixar
        videoUri = await getMedia(bucket, videoPath, {
          priority: 'high'
        });
      }
      
      setCurrentUri(videoUri);
      
    } catch (error) {
      console.error('❌ Erro ao carregar URI do vídeo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar vídeo';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (autoHideControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        hideControls();
      }, controlsTimeout);
    }
  };

  const showControlsWithTimeout = () => {
    setControlsVisible(true);
    controlsOpacity.value = withTiming(1, { duration: 200 });
    resetControlsTimeout();
  };

  const hideControls = () => {
    if (!isSeeking) {
      setControlsVisible(false);
      controlsOpacity.value = withTiming(0, { duration: 200 });
    }
  };

  const toggleControls = () => {
    if (controlsVisible) {
      hideControls();
    } else {
      showControlsWithTimeout();
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoaded(true);
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.shouldPlay || false);
      setIsBuffering(status.isBuffering || false);
      
      if (!isSeeking) {
        setSeekPosition(status.positionMillis || 0);
      }
      
      onPlaybackStatusUpdate?.(status);
      
      if (status.didJustFinish && !isLooping) {
        setIsPlaying(false);
      }
    } else {
      setIsLoaded(false);
      if ('error' in status && status.error) {
        const errorMessage = status.error;
        setError(errorMessage);
        onError?.(errorMessage);
      }
    }
  };

  const handleLoad = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setError(null);
      onLoad?.(status);
    }
  };

  const togglePlayPause = async () => {
    if (!videoRef.current || !isLoaded) return;
    
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      
      setIsPlaying(!isPlaying);
      showControlsWithTimeout();
      
    } catch (error) {
      console.error('❌ Erro ao controlar reprodução:', error);
    }
  };

  const handleSeek = async (value: number) => {
    if (!videoRef.current || !isLoaded) return;
    
    try {
      await videoRef.current.setPositionAsync(value);
      setPosition(value);
      setSeekPosition(value);
      
    } catch (error) {
      console.error('❌ Erro ao buscar posição:', error);
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
    handleSeek(seekPosition);
    resetControlsTimeout();
  };

  const changeQuality = async (quality: string) => {
    setSelectedQuality(quality);
    setShowQualityMenu(false);
    
    // Recarregar vídeo com nova qualidade
    if (videoPath && bucket) {
      try {
        const newUri = await VideoService.obterUrlStreamingVideo(videoPath, quality as any);
        setCurrentUri(newUri);
      } catch (error) {
        console.error('❌ Erro ao alterar qualidade:', error);
      }
    }
  };

  const changePlaybackSpeed = async (speed: number) => {
    if (!videoRef.current) return;
    
    try {
      await videoRef.current.setRateAsync(speed, true);
      setPlaybackRate(speed);
      setShowSpeedMenu(false);
      
    } catch (error) {
      console.error('❌ Erro ao alterar velocidade:', error);
    }
  };

  const toggleFullscreen = () => {
    const newFullscreen = !isFullscreen;
    setIsFullscreen(newFullscreen);
    onFullscreenUpdate?.(newFullscreen);
    
    // Controlar barra de status
    StatusBar.setHidden(newFullscreen, 'fade');
  };

  const skip = async (seconds: number) => {
    if (!videoRef.current || !isLoaded) return;
    
    const newPosition = Math.max(0, Math.min(duration, position + seconds * 1000));
    await handleSeek(newPosition);
    showControlsWithTimeout();
  };

  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const controlsStyle = useAnimatedStyle(() => {
    return {
      opacity: controlsOpacity.value
    };
  });

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const renderControls = () => (
    <Animated.View style={[styles.controlsContainer, controlsStyle]}>
      <SafeAreaView style={styles.controlsSafeArea}>
        {/* Header com título e qualidade */}
        <View style={styles.controlsHeader}>
          {isFullscreen && (
            <IconButton
              icon="arrow-left"
              iconColor="white"
              onPress={toggleFullscreen}
            />
          )}
          
          <View style={styles.headerInfo}>
            {enableQualitySelector && (
              <Menu
                visible={showQualityMenu}
                onDismiss={() => setShowQualityMenu(false)}
                anchor={
                  <Button
                    mode="outlined"
                    compact
                    textColor="white"
                    onPress={() => setShowQualityMenu(true)}
                    style={styles.qualityButton}
                  >
                    {availableQualities.find(q => q.value === selectedQuality)?.label || '720p'}
                  </Button>
                }
              >
                {availableQualities.map((quality) => (
                  <Menu.Item
                    key={quality.value}
                    onPress={() => changeQuality(quality.value)}
                    title={quality.label}
                    leadingIcon={selectedQuality === quality.value ? "check" : undefined}
                  />
                ))}
              </Menu>
            )}
          </View>
        </View>

        {/* Controles centrais */}
        <View style={styles.centerControls}>
          <IconButton
            icon="skip-backward"
            iconColor="white"
            size={32}
            onPress={() => skip(-10)}
          />
          
          <IconButton
            icon={isPlaying ? "pause" : "play"}
            iconColor="white"
            size={48}
            onPress={togglePlayPause}
            style={styles.playButton}
          />
          
          <IconButton
            icon="skip-forward"
            iconColor="white"
            size={32}
            onPress={() => skip(10)}
          />
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <Text variant="labelSmall" style={styles.timeText}>
              {formatTime(seekPosition)}
            </Text>
            
            <Slider
              style={styles.progressSlider}
              minimumValue={0}
              maximumValue={duration}
              value={seekPosition}
              onValueChange={setSeekPosition}
              onSlidingStart={handleSeekStart}
              onSlidingComplete={handleSeekEnd}
              minimumTrackTintColor="white"
              maximumTrackTintColor="rgba(255,255,255,0.4)"
              thumbStyle={styles.sliderThumb}
            />
            
            <Text variant="labelSmall" style={styles.timeText}>
              {formatTime(duration)}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            {/* Speed control */}
            <Menu
              visible={showSpeedMenu}
              onDismiss={() => setShowSpeedMenu(false)}
              anchor={
                <IconButton
                  icon="speedometer"
                  iconColor="white"
                  onPress={() => setShowSpeedMenu(true)}
                />
              }
            >
              {speedOptions.map((speed) => (
                <Menu.Item
                  key={speed}
                  onPress={() => changePlaybackSpeed(speed)}
                  title={`${speed}x`}
                  leadingIcon={playbackRate === speed ? "check" : undefined}
                />
              ))}
            </Menu>

            {/* Fullscreen */}
            {enableFullscreen && (
              <IconButton
                icon={isFullscreen ? "fullscreen-exit" : "fullscreen"}
                iconColor="white"
                onPress={toggleFullscreen}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );

  const renderBuffering = () => (
    <View style={styles.bufferingContainer}>
      <Text variant="bodyMedium" style={styles.bufferingText}>
        Carregando...
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#fff" />
      <Text variant="headlineSmall" style={styles.errorTitle}>
        Erro no Vídeo
      </Text>
      <Text variant="bodyMedium" style={styles.errorMessage}>
        {error || 'Não foi possível reproduzir este vídeo'}
      </Text>
      <Button
        mode="contained"
        onPress={loadVideoUri}
        style={styles.retryButton}
      >
        Tentar Novamente
      </Button>
    </View>
  );

  if (error) {
    return (
      <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
        {renderError()}
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <TouchableOpacity
        style={styles.videoTouchable}
        onPress={toggleControls}
        activeOpacity={1}
      >
        <Video
          ref={videoRef}
          source={{ uri: currentUri }}
          style={styles.video}
          resizeMode={resizeMode}
          shouldPlay={isPlaying}
          isLooping={isLooping}
          volume={currentVolume}
          rate={playbackRate}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onLoad={handleLoad}
          progressUpdateIntervalMillis={100}
        />
      </TouchableOpacity>

      {/* Buffering overlay */}
      {isBuffering && renderBuffering()}

      {/* Controls */}
      {controlsVisible && renderControls()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#000'
  },

  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000
  },

  videoTouchable: {
    flex: 1
  },

  video: {
    flex: 1
  },

  controlsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between'
  },

  controlsSafeArea: {
    flex: 1,
    justifyContent: 'space-between'
  },

  controlsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8
  },

  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  qualityButton: {
    borderColor: 'white'
  },

  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },

  playButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    marginHorizontal: 16
  },

  bottomControls: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },

  timeText: {
    color: 'white',
    minWidth: 40,
    textAlign: 'center'
  },

  progressSlider: {
    flex: 1,
    marginHorizontal: 8
  },

  sliderThumb: {
    backgroundColor: 'white'
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },

  bufferingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    transform: [{ translateY: -20 }]
  },

  bufferingText: {
    color: 'white',
    marginTop: 8
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },

  errorTitle: {
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center'
  },

  errorMessage: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 24
  },

  retryButton: {
    backgroundColor: '#2196F3'
  }
});

export default VideoPlayer;