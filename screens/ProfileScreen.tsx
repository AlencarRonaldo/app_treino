import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Switch, Modal, Linking, Share } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import FigmaScreen from '../components/FigmaScreen';
import { FigmaTheme } from '../constants/figmaTheme';
import { useAuth } from '../contexts/AuthContext';
import { useUserType } from '../contexts/UserTypeContext';
import { useFitness } from '../contexts/FitnessContext';
import { RootStackNavigationProp } from '../types/navigation';

export default function ProfileScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user, signOut } = useAuth();
  const { userType, isPersonal, isStudent, setUserType } = useUserType();
  const { criarBackup } = useFitness();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Dados simulados do usuário (em um app real, viriam de uma API ou contexto)
  const [userInfo, setUserInfo] = useState({
    age: 28,
    height: 178, // cm
    weight: 75.5, // kg
    goal: 'Ganho de massa muscular'
  });

  // Log específico para identificar problemas no perfil do aluno
  console.log('👤 ProfileScreen - Informações do usuário:', {
    user: user?.name,
    userType,
    isPersonal,
    isStudent,
    signOutFunction: typeof signOut
  });


  const handleChangeUserType = () => {
    Alert.alert(
      'Alterar Tipo de Usuário',
      'Deseja alterar entre Personal e Aluno?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Personal/Academia',
          onPress: () => setUserType('personal'),
        },
        {
          text: 'Aluno',
          onPress: () => setUserType('student'),
        },
      ]
    );
  };

  const handleEditAge = () => {
    Alert.prompt(
      'Editar Idade',
      'Digite sua idade:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salvar',
          onPress: (value) => {
            const age = parseInt(value || '0');
            if (age > 0 && age < 120) {
              setUserInfo(prev => ({ ...prev, age }));
            } else {
              Alert.alert('Erro', 'Por favor, digite uma idade válida (1-119 anos).');
            }
          }
        }
      ],
      'plain-text',
      String(userInfo.age)
    );
  };

  const handleEditHeight = () => {
    Alert.prompt(
      'Editar Altura',
      'Digite sua altura em centímetros:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salvar',
          onPress: (value) => {
            const height = parseInt(value || '0');
            if (height > 0 && height < 300) {
              setUserInfo(prev => ({ ...prev, height }));
            } else {
              Alert.alert('Erro', 'Por favor, digite uma altura válida (1-299 cm).');
            }
          }
        }
      ],
      'plain-text',
      String(userInfo.height)
    );
  };

  const handleEditWeight = () => {
    Alert.prompt(
      'Editar Peso',
      'Digite seu peso em quilogramas:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salvar',
          onPress: (value) => {
            const weight = parseFloat(value || '0');
            if (weight > 0 && weight < 500) {
              setUserInfo(prev => ({ ...prev, weight }));
            } else {
              Alert.alert('Erro', 'Por favor, digite um peso válido (0.1-499.9 kg).');
            }
          }
        }
      ],
      'plain-text',
      String(userInfo.weight)
    );
  };

  const handleEditGoal = () => {
    const goals = [
      'Perder peso',
      'Ganho de massa muscular',
      'Definição muscular',
      'Condicionamento físico',
      'Força e potência',
      'Manter a forma',
      'Reabilitação'
    ];

    Alert.alert(
      'Selecionar Objetivo',
      'Escolha seu objetivo principal:',
      [
        { text: 'Cancelar', style: 'cancel' },
        ...goals.map(goal => ({
          text: goal,
          onPress: () => setUserInfo(prev => ({ ...prev, goal }))
        }))
      ]
    );
  };

  const handleBackupData = async () => {
    try {
      await criarBackup();
      // O sucesso é mostrado pelo próprio FitnessContext
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o backup. Tente novamente.');
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Experimente o TreinosApp! O melhor app para acompanhar seus treinos e progresso na academia. 💪🏋️‍♂️',
        url: 'https://treinosapp.com', // URL do app quando publicado
        title: 'TreinosApp - Seu Personal Trainer Digital'
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const handleRateApp = () => {
    // Em um app real, abriria a loja (App Store/Google Play)
    Alert.alert(
      'Avaliar App',
      'Obrigado por usar o TreinosApp! Sua avaliação é muito importante para nós.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Avaliar', 
          onPress: () => {
            // Linking.openURL('https://apps.apple.com/app/treinosapp'); // iOS
            // Linking.openURL('https://play.google.com/store/apps/details?id=com.treinosapp'); // Android
            Alert.alert('Avaliação', 'Obrigado! Em breve você poderá avaliar o app na loja.');
          }
        }
      ]
    );
  };

  const handleHelp = () => {
    navigation.navigate('Help');
  };

  const handleAbout = () => {
    navigation.navigate('About');
  };

  const handleUnitsSettings = () => {
    Alert.alert(
      'Configurar Unidades',
      'Sistema de medidas:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Métrico (kg, cm)', onPress: () => Alert.alert('Unidades', 'Sistema métrico selecionado.') },
        { text: 'Imperial (lb, ft)', onPress: () => Alert.alert('Unidades', 'Sistema imperial ainda não disponível.') }
      ]
    );
  };

  const MenuSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menuCard}>
        {children}
      </View>
    </View>
  );

  const MenuItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent,
    showArrow = true 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>
          <Ionicons name={icon as any} size={20} color="#FF6B35" />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <Ionicons name="chevron-forward" size={20} color={FigmaTheme.colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <FigmaScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {user?.photo ? (
                <View style={styles.avatar}>
                  {/* Placeholder for user photo */}
                  <Ionicons name="person" size={40} color={FigmaTheme.colors.textSecondary} />
                </View>
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'usuario@exemplo.com'}</Text>
            <Text style={styles.memberSince}>
              Membro desde {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </Text>
          </View>

          {/* Personal Info */}
          <MenuSection title="Informações Pessoais">
            <MenuItem
              icon="calendar"
              title="Idade"
              subtitle={`${userInfo.age} anos`}
              onPress={handleEditAge}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="resize"
              title="Altura"
              subtitle={`${(userInfo.height / 100).toFixed(2)} m`}
              onPress={handleEditHeight}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="scale"
              title="Peso"
              subtitle={`${userInfo.weight} kg`}
              onPress={handleEditWeight}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="flag"
              title="Objetivo"
              subtitle={userInfo.goal}
              onPress={handleEditGoal}
            />
          </MenuSection>

          {/* Settings */}
          <MenuSection title="Configurações">
            <MenuItem
              icon="swap-horizontal"
              title="Tipo de Usuário"
              subtitle={isPersonal ? "Personal/Academia" : "Aluno"}
              onPress={handleChangeUserType}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="notifications"
              title="Notificações"
              subtitle="Lembretes de treino"
              rightComponent={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#3A3A3C', true: 'rgba(255, 107, 53, 0.3)' }}
                  thumbColor={notificationsEnabled ? '#FF6B35' : '#8E8E93'}
                />
              }
              showArrow={false}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="moon"
              title="Modo Escuro"
              subtitle="Tema escuro ativado"
              rightComponent={
                <Switch
                  value={darkModeEnabled}
                  onValueChange={setDarkModeEnabled}
                  trackColor={{ false: '#3A3A3C', true: 'rgba(255, 107, 53, 0.3)' }}
                  thumbColor={darkModeEnabled ? '#FF6B35' : '#8E8E93'}
                />
              }
              showArrow={false}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="fitness"
              title="Unidades"
              subtitle="Sistema métrico (kg, cm)"
              onPress={handleUnitsSettings}
            />
          </MenuSection>

          {/* App Options */}
          <MenuSection title="Aplicativo">
            <MenuItem
              icon="cloud-download"
              title="Backup dos Dados"
              subtitle="Exportar treinos e progresso"
              onPress={handleBackupData}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="share"
              title="Compartilhar App"
              subtitle="Convidar amigos para treinar"
              onPress={handleShareApp}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="star"
              title="Avaliar App"
              subtitle="Deixe sua avaliação na loja"
              onPress={handleRateApp}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="settings"
              title="Configurações"
              subtitle="Preferências do app"
              onPress={() => navigation.navigate('Settings')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="notifications"
              title="Notificações"
              subtitle="Gerenciar alertas"
              onPress={() => navigation.navigate('Notifications')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="help-circle"
              title="Ajuda e Suporte"
              subtitle="FAQ e contato"
              onPress={handleHelp}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="information-circle"
              title="Sobre"
              subtitle="Versão 1.0.0"
              onPress={handleAbout}
            />
            <View style={styles.menuDivider} />
          </MenuSection>

          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={() => {
              console.log('🚪 BOTÃO SAIR DA CONTA CLICADO');
              console.log('🚪 Abrindo modal customizado ao invés do Alert');
              setShowLogoutConfirm(true);
            }}
          >
            <Ionicons name="log-out" size={20} color="#FF3B30" />
            <Text style={styles.logoutButtonText}>Sair da Conta</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Modal de confirmação customizado como alternativa ao Alert */}
      <Modal
        visible={showLogoutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sair da Conta</Text>
            <Text style={styles.modalMessage}>Tem certeza de que deseja sair?</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  console.log('❌ Modal - Logout cancelado');
                  setShowLogoutConfirm(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  console.log('✅ Modal - Logout confirmado');
                  setShowLogoutConfirm(false);
                  
                  // Executar logout após fechar modal
                  setTimeout(() => {
                    console.log('🔄 Modal - Executando signOut()...');
                    signOut();
                    console.log('✅ Modal - signOut() executado');
                  }, 100);
                }}
              >
                <Text style={styles.confirmButtonText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </FigmaScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FigmaTheme.colors.background,
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: '#2C2C2E',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: FigmaTheme.colors.background,
  },
  userName: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    marginBottom: 8,
  },
  memberSince: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: 32,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemSubtitle: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#3A3A3C',
    marginHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    marginHorizontal: 32,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },
  // Estilos do modal customizado
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#3A3A3C',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});