declare module 'react-native-bottom-tabs' {
  import { ImageSourcePropType } from 'react-native';

  export type AppleIcon = {
    systemName: string;
  };

  export type TabRole = 'tab' | 'button';

  export interface TabViewProps {
    navigationState: {
      index: number;
      routes: Array<{ key: string; routeName?: string }>;
    };
    onIndexChange: (index: number) => void;
    renderScene: (props: { route: { key: string; routeName?: string } }) => React.ReactNode;
    getIcon?: (props: { route: { key: string; routeName?: string }; focused: boolean }) => ImageSourcePropType | AppleIcon;
    getLabelText?: (props: { route: { key: string; routeName?: string } }) => string;
    getBadge?: (props: { route: { key: string; routeName?: string } }) => string | undefined;
    getActiveTintColor?: (props: { route: { key: string; routeName?: string } }) => string;
    layoutDirection?: 'locale' | 'ltr' | 'rtl';
  }

  const TabView: React.FC<TabViewProps>;
  export default TabView;
}