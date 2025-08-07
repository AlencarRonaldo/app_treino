import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { Text, Card, FAB, Button, Menu, Divider, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignTokens } from '../../constants/designTokens';
import { BusinessMetricsService } from '../../services/BusinessMetricsService';
import { AnalyticsService } from '../../services/AnalyticsService';
import KPIWidget from '../../components/KPIWidget';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: 'business' | 'student' | 'workout' | 'financial';
  color: string;
  premium?: boolean;
}

export default function ReportsScreen({ navigation }: { navigation: any }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [businessSummary, setBusinessSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'business-overview',
      name: 'Relatório Executivo',
      description: 'Visão geral completa do negócio com KPIs principais',
      icon: 'analytics',
      category: 'business',
      color: DesignTokens.colors.primary
    },
    {
      id: 'financial-analysis',
      name: 'Análise Financeira',
      description: 'Receitas, despesas e projeções financeiras',
      icon: 'cash',
      category: 'financial',
      color: DesignTokens.colors.success
    },
    {
      id: 'student-performance',
      name: 'Performance dos Alunos',
      description: 'Análise individual e comparativa de progresso',
      icon: 'people',
      category: 'student',
      color: DesignTokens.colors.info
    },
    {
      id: 'workout-effectiveness',
      name: 'Eficácia dos Treinos',
      description: 'Análise de popularidade e resultados dos treinos',
      icon: 'fitness',
      category: 'workout',
      color: DesignTokens.colors.warning
    },
    {
      id: 'retention-analysis',
      name: 'Análise de Retenção',
      description: 'Churn, lifetime value e satisfação dos alunos',
      icon: 'heart',
      category: 'student',
      color: DesignTokens.colors.error
    },
    {
      id: 'market-intelligence',
      name: 'Inteligência de Mercado',
      description: 'Tendências, competidores e oportunidades',
      icon: 'trending-up',
      category: 'business',
      color: DesignTokens.colors.info,
      premium: true
    }
  ];

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const [businessMetrics] = await Promise.all([
        BusinessMetricsService.calculateStudentMetrics(),
        // Load recent reports from storage
        loadRecentReports()
      ]);

      setBusinessSummary(businessMetrics);
    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentReports = async () => {
    // Mock recent reports
    const recent = [
      {
        id: '1',
        name: 'Relatório Mensal - Março',
        type: 'business-overview',
        date: new Date().toISOString(),
        size: '2.4 MB'
      },
      {
        id: '2',
        name: 'Performance Alunos - Semana 12',
        type: 'student-performance',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        size: '1.8 MB'
      }
    ];
    setRecentReports(recent);
  };

  const generateReport = async (templateId: string) => {
    const template = reportTemplates.find(t => t.id === templateId);
    if (!template) return;

    Alert.alert(
      'Gerar Relatório',
      `Deseja gerar o relatório "${template.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Gerar', 
          onPress: async () => {
            try {
              // Show loading state
              Alert.alert('Gerando Relatório', 'Aguarde...');
              
              // Simulate report generation
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Navigate to specific analytics screen or show success
              if (templateId === 'business-overview') {
                navigation.navigate('BusinessAnalytics');
              } else if (templateId === 'student-performance') {
                navigation.navigate('StudentPerformanceAnalytics');
              } else {
                Alert.alert(
                  'Relatório Gerado',
                  `O relatório "${template.name}" foi gerado com sucesso!`,
                  [
                    { text: 'Ver Relatório', onPress: () => {} },
                    { text: 'Compartilhar', onPress: () => shareReport(template) }
                  ]
                );
              }
            } catch (error) {
              Alert.alert('Erro', 'Falha ao gerar relatório. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  const shareReport = async (template: ReportTemplate) => {
    try {
      await Share.share({
        message: `Relatório ${template.name} - ${new Date().toLocaleDateString('pt-BR')}`,
        title: template.name
      });
    } catch (error) {
      console.error('Error sharing report:', error);
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? reportTemplates 
    : reportTemplates.filter(t => t.category === selectedCategory);

  const renderBusinessSummary = () => {
    if (!businessSummary) return null;

    return (
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <LinearGradient
            colors={[DesignTokens.colors.primary, `${DesignTokens.colors.primary}CC`]}
            style={styles.summaryGradient}
          >
            <Ionicons name="speedometer" size={28} color="white" />
            <Text variant="titleLarge" style={styles.summaryTitle}>
              Resumo do Negócio
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.summaryContent}>
          <View style={styles.kpiRow}>
            <KPIWidget
              title="Alunos Ativos"
              value={businessSummary.active}
              trend={{ value: businessSummary.new, direction: 'up', label: 'novos' }}
              size="small"
              variant="minimal"
            />
            <KPIWidget
              title="Retenção"
              value={`${businessSummary.retentionRate}%`}
              trend={{ value: 2.1, direction: 'up' }}
              size="small"
              variant="minimal"
            />
          </View>

          <View style={styles.quickActions}>
            <Button
              mode="contained"
              onPress={() => generateReport('business-overview')}
              style={styles.quickActionButton}
              icon="analytics"
            >
              Relatório Completo
            </Button>
          </View>
        </View>
      </Card>
    );
  };

  const renderCategoryFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filters}>
          {[
            { key: 'all', label: 'Todos', icon: 'apps' },
            { key: 'business', label: 'Negócio', icon: 'business' },
            { key: 'student', label: 'Alunos', icon: 'people' },
            { key: 'workout', label: 'Treinos', icon: 'fitness' },
            { key: 'financial', label: 'Financeiro', icon: 'cash' }
          ].map((category) => (
            <Chip
              key={category.key}
              selected={selectedCategory === category.key}
              onPress={() => setSelectedCategory(category.key)}
              icon={category.icon}
              style={styles.categoryChip}
            >
              {category.label}
            </Chip>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderReportTemplates = () => (
    <View style={styles.templatesSection}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Modelos de Relatório
      </Text>

      <View style={styles.templatesGrid}>
        {filteredTemplates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateCard}
            onPress={() => generateReport(template.id)}
          >
            <View style={[styles.templateIcon, { backgroundColor: template.color }]}>
              <Ionicons name={template.icon} size={28} color="white" />
            </View>
            
            <View style={styles.templateContent}>
              <View style={styles.templateHeader}>
                <Text variant="titleSmall" style={styles.templateName}>
                  {template.name}
                </Text>
                {template.premium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>PRO</Text>
                  </View>
                )}
              </View>
              
              <Text variant="bodySmall" style={styles.templateDescription}>
                {template.description}
              </Text>

              <View style={styles.templateFooter}>
                <Chip mode="outlined" style={styles.categoryTag}>
                  {template.category}
                </Chip>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={DesignTokens.colors.textSecondary} 
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecentReports = () => {
    if (recentReports.length === 0) return null;

    return (
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Relatórios Recentes
          </Text>
          <Button mode="text" onPress={() => {}}>
            Ver todos
          </Button>
        </View>

        {recentReports.map((report) => (
          <TouchableOpacity key={report.id} style={styles.recentReportCard}>
            <View style={styles.recentReportIcon}>
              <Ionicons 
                name="document-text" 
                size={24} 
                color={DesignTokens.colors.primary} 
              />
            </View>
            
            <View style={styles.recentReportContent}>
              <Text variant="bodyMedium" style={styles.recentReportName}>
                {report.name}
              </Text>
              <Text variant="bodySmall" style={styles.recentReportDate}>
                {new Date(report.date).toLocaleDateString('pt-BR')} • {report.size}
              </Text>
            </View>

            <Menu
              visible={false}
              onDismiss={() => {}}
              anchor={
                <TouchableOpacity style={styles.recentReportMenu}>
                  <Ionicons 
                    name="ellipsis-vertical" 
                    size={16} 
                    color={DesignTokens.colors.textSecondary} 
                  />
                </TouchableOpacity>
              }
            >
              <Menu.Item onPress={() => {}} title="Abrir" />
              <Menu.Item onPress={() => shareReport(reportTemplates[0])} title="Compartilhar" />
              <Divider />
              <Menu.Item onPress={() => {}} title="Excluir" />
            </Menu>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Relatórios & Analytics
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Insights profissionais do seu negócio
          </Text>
        </View>

        {/* Business Summary */}
        {renderBusinessSummary()}

        {/* Category Filters */}
        {renderCategoryFilters()}

        {/* Report Templates */}
        {renderReportTemplates()}

        {/* Recent Reports */}
        {renderRecentReports()}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Export FAB */}
      <FAB
        icon="download"
        style={styles.fab}
        onPress={() => {
          Alert.alert(
            'Exportar Dados',
            'Escolha o formato de exportação:',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'PDF', onPress: () => {} },
              { text: 'Excel', onPress: () => {} },
              { text: 'CSV', onPress: () => {} }
            ]
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.md,
  },
  headerTitle: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  headerSubtitle: {
    color: DesignTokens.colors.textSecondary,
    marginTop: 4,
  },
  summaryCard: {
    marginHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.md,
  },
  summaryHeader: {
    overflow: 'hidden',
    borderTopLeftRadius: DesignTokens.borderRadius.lg,
    borderTopRightRadius: DesignTokens.borderRadius.lg,
  },
  summaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
  },
  summaryTitle: {
    color: 'white',
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    marginLeft: DesignTokens.spacing.md,
  },
  summaryContent: {
    padding: DesignTokens.spacing.lg,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
  },
  quickActions: {
    alignItems: 'center',
  },
  quickActionButton: {
    backgroundColor: DesignTokens.colors.primary,
  },
  filtersContainer: {
    marginBottom: DesignTokens.spacing.lg,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.sm,
  },
  categoryChip: {
    backgroundColor: DesignTokens.colors.surface,
  },
  templatesSection: {
    marginBottom: DesignTokens.spacing.xl,
  },
  sectionTitle: {
    paddingHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  templatesGrid: {
    paddingHorizontal: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.sm,
  },
  templateCard: {
    flexDirection: 'row',
    backgroundColor: DesignTokens.colors.surface,
    borderRadius: DesignTokens.borderRadius.lg,
    padding: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.sm,
    ...DesignTokens.shadows.sm,
  },
  templateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateContent: {
    flex: 1,
    marginLeft: DesignTokens.spacing.md,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  templateName: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
    flex: 1,
  },
  premiumBadge: {
    backgroundColor: DesignTokens.colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumText: {
    color: 'white',
    fontSize: 8,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
  },
  templateDescription: {
    color: DesignTokens.colors.textSecondary,
    marginBottom: DesignTokens.spacing.sm,
    lineHeight: 18,
  },
  templateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTag: {
    backgroundColor: DesignTokens.colors.surfaceVariant,
    height: 24,
  },
  recentSection: {
    marginBottom: DesignTokens.spacing.xl,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
  },
  recentReportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignTokens.colors.surface,
    borderRadius: DesignTokens.borderRadius.md,
    padding: DesignTokens.spacing.md,
    marginHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.sm,
    ...DesignTokens.shadows.sm,
  },
  recentReportIcon: {
    width: 40,
    height: 40,
    backgroundColor: `${DesignTokens.colors.primary}20`,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentReportContent: {
    flex: 1,
    marginLeft: DesignTokens.spacing.md,
  },
  recentReportName: {
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
    color: DesignTokens.colors.textPrimary,
  },
  recentReportDate: {
    color: DesignTokens.colors.textSecondary,
    marginTop: 2,
  },
  recentReportMenu: {
    padding: DesignTokens.spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: DesignTokens.colors.secondary,
  },
  bottomSpacing: {
    height: 100,
  },
});