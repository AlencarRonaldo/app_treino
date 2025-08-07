import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Modal, 
  StatusBar, 
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  State
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { 
  IconButton, 
  Text, 
  Surface, 
  Button,
  Portal,
  ActivityIndicator 
} from 'react-native-paper';
import { MediaService } from '../../services/MediaService';
import { PhotoService, ProgressPhoto } from '../../services/PhotoService';
import { CustomExerciseVideo } from '../../services/VideoService';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface MediaViewerProps {
  visible: boolean;
  onClose: () => void;
  
  // Mídia única
  mediaUri?: string;
  mediaType?: 'image' | 'video';
  
  // Mídia de progresso
  progressPhoto?: ProgressPhoto;
  
  // Vídeo de exercício
  exerciseVideo?: CustomExerciseVideo;
  
  // Gallery mode
  mediaList?: Array<{
    id: string;
    uri: string;
    type: 'image' | 'video';
    title?: string;
    description?: string;
  }>;
  initialIndex?: number;
  
  // Configurações
  allowZoom?: boolean;
  allowShare?: boolean;
  allowDelete?: boolean;
  showInfo?: boolean;
  
  // Callbacks
  onShare?: (mediaUri: string) => void;
  onDelete?: (mediaId: string) => void;
  onIndexChange?: (index: number) => void;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

export const MediaViewer: React.FC<MediaViewerProps> = ({
  visible,
  onClose,
  mediaUri,
  mediaType,
  progressPhoto,
  exerciseVideo,
  mediaList = [],
  initialIndex = 0,
  allowZoom = true,
  allowShare = false,
  allowDelete = false,
  showInfo = true,
  onShare,
  onDelete,
  onIndexChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [videoStatus, setVideoStatus] = useState<any>({});

  // Animação para zoom e pan
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // Refs
  const doubleTapRef = useRef<TapGestureHandler>(null);
  const videoRef = useRef<Video>(null);

  // Controle de visibilidade dos controles
  useEffect(() => {
    if (visible) {
      setShowControls(true);
      
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, currentIndex]);

  // Carregar mídia atual
  useEffect(() => {
    if (!visible) return;
    
    loadCurrentMedia();
  }, [visible, currentIndex, mediaUri, progressPhoto, exerciseVideo]);

  const loadCurrentMedia = async () => {
    setIsLoading(true);
    
    try {
      let url = '';
      
      if (mediaUri) {
        // Mídia URI direta
        url = mediaUri;
      } else if (progressPhoto) {
        // Foto de progresso
        url = await MediaService.downloadMedia('progress-photos', progressPhoto.photoPath);
      } else if (exerciseVideo) {
        // Vídeo de exercício
        url = await MediaService.downloadMedia('exercise-videos', exerciseVideo.videoPath);
      } else if (mediaList.length > 0) {
        // Lista de mídia
        const currentMedia = mediaList[currentIndex];
        url = currentMedia.uri;
      }
      
      setMediaUrl(url);
      
    } catch (error) {
      console.error('❌ Erro ao carregar mídia:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentMediaType = (): 'image' | 'video' => {
    if (mediaType) return mediaType;
    if (progressPhoto) return 'image';
    if (exerciseVideo) return 'video';
    if (mediaList.length > 0) return mediaList[currentIndex]?.type || 'image';
    return 'image';
  };

  const getCurrentMediaInfo = () => {
    if (progressPhoto) {
      return {
        title: `Progresso - ${progressPhoto.categoria}`,
        description: `${progressPhoto.partesCorpo.join(', ')} • ${progressPhoto.dataFoto}`,
        details: [
          progressPhoto.peso ? `Peso: ${progressPhoto.peso}kg` : null,
          progressPhoto.medidas ? `Medidas: ${Object.keys(progressPhoto.medidas).length} registros` : null
        ].filter(Boolean)
      };
    }
    
    if (exerciseVideo) {
      return {
        title: exerciseVideo.title,
        description: exerciseVideo.description,
        details: [
          `Duração: ${Math.round(exerciseVideo.duration / 1000)}s`,
          `Tags: ${exerciseVideo.tags.join(', ')}`
        ]
      };
    }
    
    if (mediaList.length > 0) {
      const current = mediaList[currentIndex];
      return {
        title: current.title || `Mídia ${currentIndex + 1}`,
        description: current.description || '',
        details: []
      };
    }
    
    return {
      title: 'Mídia',
      description: '',
      details: []
    };
  };

  // Gestos para zoom e pan
  const pinchGestureEvent = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startScale = scale.value;
    },
    onActive: (event, context) => {
      scale.value = context.startScale * event.scale;
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    },
    onEnd: () => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      } else if (scale.value > 3) {
        scale.value = withSpring(3);
      }
    }
  });

  const panGestureEvent = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      if (scale.value > 1) {
        translateX.value = context.startX + event.translationX;
        translateY.value = context.startY + event.translationY;
      }
    },
    onEnd: () => {
      if (scale.value <= 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    }
  });

  const doubleTapEvent = useAnimatedGestureHandler({
    onStart: () => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      } else {
        scale.value = withSpring(2);
      }
    }
  });

  const singleTapEvent = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(toggleControls)();
    }
  });

  const toggleControls = () => {
    setShowControls(prev => !prev);
  };

  const resetZoom = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  };

  const navigateMedia = (direction: 'prev' | 'next') => {
    if (mediaList.length <= 1) return;
    
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % mediaList.length
      : (currentIndex - 1 + mediaList.length) % mediaList.length;
    
    setCurrentIndex(newIndex);
    onIndexChange?.(newIndex);
    resetZoom();
  };

  const handleShare = () => {
    if (onShare && mediaUrl) {
      onShare(mediaUrl);
    }
  };

  const handleDelete = () => {
    const mediaInfo = getCurrentMediaInfo();
    if (onDelete && mediaInfo.title) {
      onDelete(mediaInfo.title);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value }
      ]
    };
  });

  if (!visible) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
        
        <View style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            {/* Header com controles */}
            {showControls && (
              <Animated.View 
                style={styles.header}
                entering={withTiming}
                exiting={withTiming}
              >
                <IconButton
                  icon="close"
                  iconColor="white"
                  size={24}
                  onPress={onClose}
                />
                
                <View style={styles.headerInfo}>
                  {mediaList.length > 1 && (
                    <Text variant="bodyMedium" style={styles.headerText}>
                      {currentIndex + 1} de {mediaList.length}
                    </Text>
                  )}
                </View>
                
                <View style={styles.headerActions}>
                  {allowShare && (
                    <IconButton
                      icon="share"
                      iconColor="white"
                      size={24}
                      onPress={handleShare}
                    />
                  )}
                  
                  {allowDelete && (
                    <IconButton
                      icon="delete"
                      iconColor="white"
                      size={24}
                      onPress={handleDelete}
                    />
                  )}
                </View>
              </Animated.View>
            )}

            {/* Conteúdo principal */}
            <View style={styles.content}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="white" />
                  <Text variant="bodyMedium" style={styles.loadingText}>
                    Carregando mídia...
                  </Text>
                </View>
              ) : (
                <TapGestureHandler
                  onGestureEvent={singleTapEvent}
                  waitFor={doubleTapRef}
                >
                  <Animated.View style={styles.mediaContainer}>
                    {getCurrentMediaType() === 'image' ? (
                      <TapGestureHandler
                        ref={doubleTapRef}
                        numberOfTaps={2}
                        onGestureEvent={doubleTapEvent}
                      >
                        <Animated.View>
                          <PanGestureHandler onGestureEvent={panGestureEvent}>
                            <Animated.View>
                              <PinchGestureHandler onGestureEvent={pinchGestureEvent}>
                                <Animated.View>
                                  <AnimatedImage
                                    source={{ uri: mediaUrl }}
                                    style={[styles.image, animatedStyle]}
                                    contentFit="contain"
                                    transition={300}
                                  />
                                </Animated.View>
                              </PinchGestureHandler>
                            </Animated.View>
                          </PanGestureHandler>
                        </Animated.View>
                      </TapGestureHandler>
                    ) : (
                      <Video
                        ref={videoRef}
                        source={{ uri: mediaUrl }}
                        style={styles.video}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay={visible}
                        onPlaybackStatusUpdate={setVideoStatus}
                      />
                    )}
                  </Animated.View>
                </TapGestureHandler>
              )}
            </View>

            {/* Navegação lateral */}
            {mediaList.length > 1 && (
              <>
                <View style={[styles.navigation, styles.navigationLeft]}>
                  <IconButton
                    icon="chevron-left"
                    iconColor="white"
                    size={32}
                    onPress={() => navigateMedia('prev')}
                    style={styles.navButton}
                  />
                </View>
                
                <View style={[styles.navigation, styles.navigationRight]}>
                  <IconButton
                    icon="chevron-right"
                    iconColor="white"
                    size={32}
                    onPress={() => navigateMedia('next')}
                    style={styles.navButton}
                  />
                </View>
              </>
            )}

            {/* Footer com informações */}
            {showInfo && showControls && !isLoading && (
              <Animated.View 
                style={styles.footer}
                entering={withTiming}
                exiting={withTiming}
              >
                <Surface style={styles.infoCard}>
                  {(() => {
                    const info = getCurrentMediaInfo();
                    return (
                      <View>
                        <Text variant="titleMedium" style={styles.infoTitle}>
                          {info.title}
                        </Text>
                        
                        {info.description && (
                          <Text variant="bodyMedium" style={styles.infoDescription}>
                            {info.description}
                          </Text>
                        )}
                        
                        {info.details.length > 0 && (
                          <View style={styles.infoDetails}>
                            {info.details.map((detail, index) => (
                              <Text key={index} variant="bodySmall" style={styles.infoDetail}>
                                • {detail}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })()}
                </Surface>
              </Animated.View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)'
  },

  safeArea: {
    flex: 1
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },

  headerInfo: {
    flex: 1,
    alignItems: 'center'
  },

  headerText: {
    color: 'white'
  },

  headerActions: {
    flexDirection: 'row'
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  loadingContainer: {
    alignItems: 'center'
  },

  loadingText: {
    color: 'white',
    marginTop: 16
  },

  mediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200,
    justifyContent: 'center',
    alignItems: 'center'
  },

  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200
  },

  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 200
  },

  navigation: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -25 }],
    zIndex: 10
  },

  navigationLeft: {
    left: 16
  },

  navigationRight: {
    right: 16
  },

  navButton: {
    backgroundColor: 'rgba(0,0,0,0.5)'
  },

  footer: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },

  infoCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)'
  },

  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 4
  },

  infoDescription: {
    marginBottom: 8,
    color: '#666'
  },

  infoDetails: {
    marginTop: 8
  },

  infoDetail: {
    marginBottom: 2,
    color: '#666'
  }
});

export default MediaViewer;