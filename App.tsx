import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LembretesProvider, useLembretes } from './src/LembretesContext';
import NovoLembreteScreen from './src/screens/NovoLembreteScreen';
import AgendadosScreen from './src/screens/AgendadosScreen';
import { cores } from './src/theme';

// cria a navegação por abas na parte de baixo da tela
const Tab = createBottomTabNavigator();

// tema da navegação com as cores rosa do app
const tema = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: cores.fundo, primary: cores.rosa },
};

// define as duas abas do app
function Abas() {
  // usa a lista para mostrar o número de pendentes na aba
  const { lembretes } = useLembretes();
  const pendentes = lembretes.filter((l) => l.status !== 'concluido').length;

  return (
    <Tab.Navigator
      // configurações que valem para todas as abas
      screenOptions={{
        // esconde o cabeçalho padrão, cada tela tem o seu
        headerShown: false,
        // cor do ícone da aba selecionada
        tabBarActiveTintColor: cores.rosa,
        // cor do ícone das abas não selecionadas
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarStyle: {
          backgroundColor: cores.card,
          borderTopColor: cores.borda,
        },
      }}
    >
      {/* aba de cadastro de lembrete */}
      <Tab.Screen
        name="Novo"
        component={NovoLembreteScreen}
        options={{
          title: 'Novo',
          // ícone cheio quando a aba está selecionada
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={26} color={color} />
          ),
        }}
      />
      {/* aba da lista de lembretes agendados */}
      <Tab.Screen
        name="Agendados"
        component={AgendadosScreen}
        options={{
          title: 'Agendados',
          // bolinha com o número de pendentes, some quando é zero
          tabBarBadge: pendentes > 0 ? pendentes : undefined,
          tabBarBadgeStyle: { backgroundColor: cores.rosa, color: cores.branco },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// componente principal do app
export default function App() {
  return (
    // cuida das margens da câmera e da barra de status
    <SafeAreaProvider>
      {/* deixa os lembretes disponíveis para todas as telas */}
      <LembretesProvider>
        {/* container obrigatório da navegação */}
        <NavigationContainer theme={tema}>
          {/* ícones da barra de status em branco, por causa do cabeçalho rosa */}
          <StatusBar style="light" />
          <Abas />
        </NavigationContainer>
      </LembretesProvider>
    </SafeAreaProvider>
  );
}
