/**
 * TREINOSAPP - PRODUCTION BUNDLE OPTIMIZATION
 * Advanced bundle optimization, code splitting, and performance configurations
 * 
 * Features:
 * - Tree shaking and dead code elimination
 * - Dynamic imports and code splitting
 * - Asset optimization and compression
 * - Production-ready webpack configuration
 */

const { getDefaultConfig } = require('expo/metro-config');
const { resolver: defaultResolver } = getDefaultConfig(__dirname);

// ===================================================================
// BUNDLE OPTIMIZATION CONFIGURATION
// ===================================================================

const PRODUCTION_CONFIG = {
  bundleOptimization: {
    enableHermes: true,
    enableProguard: true,
    enableSeparateDataExtenions: true,
    enableDexOpt: true,
  },
  assetOptimization: {
    imageCompression: 0.8,
    vectorOptimization: true,
    fontSubsetting: true,
    svgoOptimization: true,
  },
  codeOptimization: {
    treeshaking: true,
    deadCodeElimination: true,
    minification: true,
    obfuscation: true,
  },
  performanceTargets: {
    maxBundleSize: 50 * 1024 * 1024, // 50MB
    maxInitialLoadTime: 3000, // 3 seconds
    maxChunkSize: 10 * 1024 * 1024, // 10MB per chunk
  },
};

// ===================================================================
// METRO CONFIGURATION FOR PRODUCTION
// ===================================================================

const config = getDefaultConfig(__dirname);

// Bundle splitting and optimization
config.resolver = {
  ...defaultResolver,
  alias: {
    // Production aliases for optimized components
    '@components': './components',
    '@services': './services',
    '@utils': './utils',
    '@screens': './screens',
    '@hooks': './hooks',
    '@types': './types',
  },
  platforms: ['ios', 'android', 'web'],
  assetExts: [
    ...defaultResolver.assetExts,
    'bin', 'txt', 'jpg', 'png', 'json', 'mp4', 'webm', 'wav', 'mp3', 'webp'
  ],
  sourceExts: [
    ...defaultResolver.sourceExts,
    'jsx', 'ts', 'tsx'
  ],
};

// Transformer optimizations
config.transformer = {
  ...config.transformer,
  minifierPath: require.resolve('metro-minify-terser'),
  minifierConfig: {
    ecma: 8,
    keep_fnames: false,
    mangle: {
      keep_fnames: false,
      reserved: [],
    },
    compress: {
      drop_console: true, // Remove console.log in production
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.warn', 'console.debug'],
      passes: 3,
    },
    output: {
      comments: false,
      ascii_only: true,
    },
  },
  // Enable Hermes for better performance
  hermesCommand: require.resolve('hermes-engine/hermes'),
  enableBabelRCLookup: false,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
};

// Serializer optimizations
config.serializer = {
  ...config.serializer,
  createModuleIdFactory: () => {
    const fileToIdMap = new Map();
    let nextId = 0;
    return (path) => {
      if (!fileToIdMap.has(path)) {
        fileToIdMap.set(path, nextId++);
      }
      return fileToIdMap.get(path);
    };
  },
  // Enable experimental tree shaking
  experimentalTreeShaking: true,
  // Custom module filter for production
  processModuleFilter: (module) => {
    // Exclude dev dependencies from production bundle
    if (module.path.includes('node_modules')) {
      const packageName = module.path.match(/node_modules\/([^\/]+)/)?.[1];
      if (DEV_ONLY_PACKAGES.includes(packageName)) {
        return false;
      }
    }
    return true;
  },
};

// Development-only packages to exclude from production
const DEV_ONLY_PACKAGES = [
  'react-devtools',
  'flipper',
  'react-native-flipper',
  '@react-native-community/eslint-config',
  'metro-react-native-babel-preset',
  'jest',
  '@testing-library',
  'detox',
];

// ===================================================================
// ASSET OPTIMIZATION CONFIGURATION
// ===================================================================

const AssetOptimizer = {
  // Image optimization settings
  images: {
    jpeg: { quality: 0.8 },
    png: { compressionLevel: 6 },
    webp: { quality: 0.8, alphaQuality: 0.8 },
  },

  // Font optimization
  fonts: {
    subset: true,
    formats: ['woff2', 'woff'],
    unicodeRanges: [
      'U+0000-00FF', // Basic Latin
      'U+0100-017F', // Latin Extended-A
      'U+0180-024F', // Latin Extended-B
      'U+1E00-1EFF', // Latin Extended Additional
    ],
  },

  // SVG optimization
  svg: {
    removeViewBox: false,
    removeDimensions: true,
    cleanupAttrs: true,
    removeDoctype: true,
    removeComments: true,
    cleanupNumericValues: true,
    convertColors: true,
  },
};

// ===================================================================
// CODE SPLITTING STRATEGY
// ===================================================================

const CodeSplittingStrategy = {
  // Chunk splitting points
  chunks: [
    {
      name: 'vendor',
      test: /[\\/]node_modules[\\/]/,
      chunks: 'all',
      priority: 20,
      maxSize: 500000, // 500KB
    },
    {
      name: 'common',
      minChunks: 2,
      chunks: 'all',
      priority: 10,
      reuseExistingChunk: true,
    },
    {
      name: 'screens',
      test: /[\\/]screens[\\/]/,
      chunks: 'all',
      priority: 15,
    },
    {
      name: 'services',
      test: /[\\/]services[\\/]/,
      chunks: 'all',
      priority: 12,
    },
  ],

  // Dynamic imports for lazy loading
  dynamicImports: [
    // Screens that can be lazy loaded
    './screens/SettingsScreen',
    './screens/AboutScreen',
    './screens/HelpScreen',
    './screens/StudentsManagementScreen',
    
    // Heavy components
    './components/analytics/AnalyticsChart',
    './components/media/VideoPlayer',
    './components/media/MediaGallery',
    
    // Services that can be loaded on demand
    './services/AnalyticsService',
    './services/MediaOptimizationService',
    './services/BusinessMetricsService',
  ],
};

// ===================================================================
// PRODUCTION BUILD OPTIMIZATION
// ===================================================================

function createProductionOptimizations() {
  return {
    // Bundle analysis
    analyzer: {
      enabled: process.env.ANALYZE_BUNDLE === 'true',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
    },

    // Performance hints
    performance: {
      hints: 'warning',
      maxAssetSize: PRODUCTION_CONFIG.performanceTargets.maxChunkSize,
      maxEntrypointSize: PRODUCTION_CONFIG.performanceTargets.maxBundleSize,
    },

    // Cache optimization
    cache: {
      type: 'filesystem',
      cacheDirectory: '.cache/webpack',
      buildDependencies: {
        config: [__filename],
      },
    },

    // Module concatenation
    concatenateModules: true,

    // Side effects optimization
    sideEffects: false,

    // Optimization flags
    usedExports: true,
    providedExports: true,
  };
}

// ===================================================================
// PERFORMANCE MONITORING
// ===================================================================

function addPerformanceMonitoring(config) {
  // Add performance monitoring to the build process
  const originalTransform = config.transformer.transform;
  
  config.transformer.transform = function(params) {
    const startTime = Date.now();
    
    const result = originalTransform.call(this, params);
    
    const transformTime = Date.now() - startTime;
    if (transformTime > 1000) { // Log slow transforms
      console.warn(`🐌 Slow transform: ${params.filename} (${transformTime}ms)`);
    }
    
    return result;
  };
  
  return config;
}

// ===================================================================
// DEVELOPMENT vs PRODUCTION CONFIGURATION
// ===================================================================

if (process.env.NODE_ENV === 'production') {
  // Production optimizations
  console.log('🚀 Building for production with optimizations');
  
  // Apply production optimizations
  config.optimization = createProductionOptimizations();
  
  // Add performance monitoring
  addPerformanceMonitoring(config);
  
  // Enable minification
  config.transformer.minifierConfig.compress.drop_console = true;
  
} else {
  // Development optimizations
  console.log('⚡ Building for development with fast refresh');
  
  // Keep console.log for development
  config.transformer.minifierConfig.compress.drop_console = false;
  
  // Fast refresh configuration
  config.transformer.enableBabelRCLookup = true;
}

// ===================================================================
// BUNDLE ANALYSIS HELPERS
// ===================================================================

function analyzeBundleSize(bundleStats) {
  const totalSize = bundleStats.assets.reduce((sum, asset) => sum + asset.size, 0);
  const oversizedAssets = bundleStats.assets.filter(
    asset => asset.size > PRODUCTION_CONFIG.performanceTargets.maxChunkSize
  );
  
  console.log(`📊 Bundle Analysis:`);
  console.log(`   Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Asset Count: ${bundleStats.assets.length}`);
  
  if (oversizedAssets.length > 0) {
    console.warn(`⚠️  Oversized Assets (>${PRODUCTION_CONFIG.performanceTargets.maxChunkSize / 1024 / 1024}MB):`);
    oversizedAssets.forEach(asset => {
      console.warn(`   ${asset.name}: ${(asset.size / 1024 / 1024).toFixed(2)} MB`);
    });
  }
  
  if (totalSize > PRODUCTION_CONFIG.performanceTargets.maxBundleSize) {
    console.error(`❌ Bundle exceeds maximum size limit!`);
    process.exit(1);
  }
}

// ===================================================================
// EXPORTS
// ===================================================================

module.exports = {
  ...config,
  PRODUCTION_CONFIG,
  AssetOptimizer,
  CodeSplittingStrategy,
  analyzeBundleSize,
};