import fs from 'node:fs';
import path from 'node:path';

const mobileRoot = path.resolve(__dirname, '../..');

const NATIVE_TABS_ROUTE_EXCLUSIONS = {
  Onboarding: 'First-run setup route shown before the tab host exists.',
  FoodsLibrary: 'Root-stack library drill-in presented above the tab host.',
  MealsLibrary: 'Root-stack library drill-in presented above the tab host.',
  ExercisesLibrary: 'Root-stack library drill-in presented above the tab host.',
  WorkoutPresetsLibrary: 'Root-stack library drill-in presented above the tab host.',
  WorkoutPresetDetail: 'Root-stack detail route presented above the tab host.',
  WorkoutPresetForm: 'Root-stack create/edit modal presented above the tab host.',
  MealDetail: 'Root-stack detail route presented above the tab host.',
  FoodDetail: 'Root-stack detail route presented above the tab host.',
  EditBarcode: 'Root-stack settings/detail editor presented above the tab host.',
  ExerciseDetail: 'Root-stack detail route presented above the tab host.',
  FoodEntryAdd: 'Root-stack food-entry modal presented from the tab host.',
  EditLoggedMeal: 'Root-stack diary editor presented above the tab host.',
  FoodEntryView: 'Root-stack diary detail route presented above the tab host.',
  MealTypeDetail: 'Root-stack diary detail route presented above the tab host.',
  FoodForm: 'Root-stack food create/edit modal presented above the tab host.',
  ExerciseForm: 'Root-stack exercise create/edit modal presented above the tab host.',
  FoodScan: 'Root-stack scanner modal presented from the tab host.',
  FoodPhotoIntro: 'Root-stack food-photo modal presented from the tab host.',
  FoodPhotoFlow: 'Root-stack nested food-photo modal with its own native stack.',
  MealAdd: 'Root-stack meal create/edit modal presented above the tab host.',
  ExerciseSearch: 'Root-stack exercise picker modal presented above the tab host.',
  PresetSearch: 'Root-stack preset picker route presented above the tab host.',
  WorkoutAdd: 'Root-stack workout create/edit route presented above the tab host.',
  ActivityAdd: 'Root-stack activity create/edit route presented above the tab host.',
  WorkoutDetail: 'Root-stack workout detail route presented above the tab host.',
  ActivityDetail: 'Root-stack activity detail route presented above the tab host.',
  FastingDetail: 'Root-stack dashboard detail route presented above the tab host.',
  Logs: 'Root-stack settings route presented above the tab host.',
  Sync: 'Root-stack settings route presented above the tab host.',
  MeasurementsAdd: 'Root-stack measurement modal presented from the tab host.',
  CalorieSettings: 'Root-stack settings route presented above the tab host.',
  FoodSettings: 'Root-stack settings route presented above the tab host.',
  DashboardSettings: 'Root-stack settings route presented above the tab host.',
  ServerSettings: 'Root-stack settings route presented above the tab host.',
  AppSettings: 'Root-stack settings route presented above the tab host.',
  About: 'Root-stack settings route presented above the tab host.',
  WhatsNew: 'Root-stack informational route presented above the tab host.',
} satisfies Record<string, string>;

const NATIVE_HEADER_ROOT_ROUTES = {
  Chat: 'Ask Sparky uses the root native stack header for the title and clear action.',
  FoodSearch: 'Add Food search uses the root native stack header instead of its screen-owned header on iOS.',
} satisfies Record<string, string>;

const NATIVE_HEADER_SCREENS_WITH_REACT_HEADER = [
  'src/screens/ChatScreen.tsx',
  'src/screens/ActivityDetailScreen.tsx',
  'src/screens/EditBarcodeScreen.tsx',
  'src/screens/EditLoggedMealScreen.tsx',
  'src/screens/ExerciseDetailScreen.tsx',
  'src/screens/ExerciseFormScreen.tsx',
  'src/screens/FoodDetailScreen.tsx',
  'src/screens/FoodEntryAddScreen.tsx',
  'src/screens/FoodEntryViewScreen.tsx',
  'src/screens/FoodFormScreen.tsx',
  'src/screens/LogScreen.tsx',
  'src/screens/MealAddScreen.tsx',
  'src/screens/MeasurementsAddScreen.tsx',
  'src/screens/WorkoutDetailScreen.tsx',
  'src/screens/WorkoutPresetDetailScreen.tsx',
  'src/screens/WorkoutPresetFormScreen.tsx',
] as const;

function readMobileFile(relativePath: string): string {
  return fs.readFileSync(path.join(mobileRoot, relativePath), 'utf8');
}

function extractTypeKeys(source: string, typeName: string): string[] {
  const match = source.match(
    new RegExp(`export type ${typeName} = \\{([\\s\\S]*?)^\\};`, 'm'),
  );
  if (!match) {
    throw new Error(`Could not find ${typeName} in navigation.ts`);
  }

  return [...match[1].matchAll(/^  ([A-Za-z0-9_]+):/gm)]
    .map((item) => item[1])
    .sort();
}

function extractScreenNames(source: string, navigatorName: string): string[] {
  return [
    ...source.matchAll(
      new RegExp(`<${navigatorName}\\.Screen[\\s\\S]*?name="([^"]+)"`, 'g'),
    ),
  ]
    .map((item) => item[1])
    .sort();
}

function missingFrom(expected: string[], actual: string[]): string[] {
  const actualSet = new Set(actual);
  return expected.filter((item) => !actualSet.has(item));
}

function unexpectedFrom(expected: string[], actual: string[]): string[] {
  const expectedSet = new Set(expected);
  return actual.filter((item) => !expectedSet.has(item));
}

function formatList(items: string[]): string {
  return items.length > 0 ? items.join(', ') : 'none';
}

function hasNativeHeaderItems(source: string): boolean {
  return /unstable_header(?:Right|Left)Items/.test(source);
}

function hasPotentialReactHeader(source: string): boolean {
  return (
    source.includes('FormScreenChrome') ||
    /\brenderHeader\b/.test(source) ||
    /{\s*\/\*\s*Header\s*\*\/\s*}/.test(source) ||
    /\bListHeader\b/.test(source)
  );
}

function getStackScreenBlock(source: string, routeName: string): string | undefined {
  const routeIndex = source.indexOf(`name="${routeName}"`);
  if (routeIndex === -1) return undefined;

  const start = source.lastIndexOf('<Stack.Screen', routeIndex);
  if (start === -1) return undefined;

  const nextScreen = source.indexOf('\n          <Stack.Screen', routeIndex);
  const navigatorEnd = source.indexOf('\n        </Stack.Navigator>', routeIndex);
  const candidates = [nextScreen, navigatorEnd].filter((index) => index !== -1);
  const end = candidates.length > 0 ? Math.min(...candidates) : source.length;

  return source.slice(start, end);
}

function hidesReactHeaderOnIOS(source: string): boolean {
  const formScreenChromeSource = readMobileFile('src/components/FormScreenChrome.tsx');
  return (
    /Platform\.OS\s*!==\s*'ios'\s*&&/.test(source) ||
    /Platform\.OS\s*===\s*'ios'\s*\?\s*null\s*:/.test(source) ||
    (source.includes('FormScreenChrome') &&
      /Platform\.OS\s*!==\s*'ios'\s*&&/.test(formScreenChromeSource))
  );
}

function failNativeHeaderContract(message: string): never {
  throw new Error(
    [
      message,
      '',
      'Native header implementation contract:',
      '- Root stack routes must be declared in RootStackParamList and registered as <Stack.Screen> in App.tsx.',
      '- iOS root-stack screens should use createStackScreenOptions(...) or equivalent explicit iOS native-stack options so the native header is configured in the same place as the route.',
      '- Tab routes must be declared in TabParamList and registered in both NativeTab.Screen and FallbackTab.Screen in TabsLayout.tsx.',
      '- Native iOS tab content must stay wrapped in its tab-local createNativeStackNavigator screen so Dashboard, Diary, Library, and Settings get native headers under the Liquid Glass tab path.',
      '- When adding a new native tab, add the TabParamList entry, the NativeTab.Screen entry, the FallbackTab.Screen entry, and a matching tab-local native stack screen with createIOSNativeHeaderOptions.',
      '- When adding a root-stack screen that should use the native iOS header, add it to NATIVE_HEADER_ROOT_ROUTES and register it in App.tsx with createStackScreenOptions(...) or equivalent iOS native-stack options. Do not set headerShown: false for that route.',
      '- When adding a new root-stack screen that is intentionally presented above Tabs instead of inside native tabs mode, add it to NATIVE_TABS_ROUTE_EXCLUSIONS with a short reason.',
      '- When a screen configures native header items with unstable_headerRightItems or unstable_headerLeftItems, hide the screen-owned React header on iOS. Use patterns like {Platform.OS !== \'ios\' && <Header />} or const renderHeader = () => Platform.OS === \'ios\' ? null : <Header />. Otherwise iOS shows two headers.',
    ].join('\n'),
  );
}

describe('native header navigation contract', () => {
  const navigationSource = readMobileFile('src/types/navigation.ts');
  const appSource = readMobileFile('App.tsx');
  const tabsSource = readMobileFile('src/components/TabsLayout.tsx');

  it('keeps RootStackParamList aligned with App.tsx native-stack screens', () => {
    const rootStackRoutes = extractTypeKeys(navigationSource, 'RootStackParamList');
    const appScreens = extractScreenNames(appSource, 'Stack');

    const missingScreens = missingFrom(rootStackRoutes, appScreens);
    const staleScreens = unexpectedFrom(rootStackRoutes, appScreens);

    if (missingScreens.length > 0 || staleScreens.length > 0) {
      failNativeHeaderContract(
        [
          'RootStackParamList and App.tsx are out of sync.',
          `Routes declared in RootStackParamList but missing from <Stack.Screen>: ${formatList(missingScreens)}.`,
          `Screens registered in App.tsx but missing from RootStackParamList: ${formatList(staleScreens)}.`,
        ].join('\n'),
      );
    }
  });

  it('requires every root-stack screen to have native-tabs coverage or an explicit exclusion reason', () => {
    const rootStackRoutes = extractTypeKeys(navigationSource, 'RootStackParamList');
    const appScreens = extractScreenNames(appSource, 'Stack');
    const nativeTabScreens = extractScreenNames(tabsSource, 'NativeTab');
    const nativeHeaderRootRoutes = Object.keys(NATIVE_HEADER_ROOT_ROUTES);
    const nativeTabsModeRoutes = new Set(['Tabs', ...nativeTabScreens, ...nativeHeaderRootRoutes]);
    const exclusionEntries = Object.entries(NATIVE_TABS_ROUTE_EXCLUSIONS);
    const excludedRoutes = new Set(exclusionEntries.map(([route]) => route));

    const missingNativeTabsRoutes = rootStackRoutes.filter(
      (route) => !nativeTabsModeRoutes.has(route) && !excludedRoutes.has(route),
    );
    const staleExclusions = exclusionEntries
      .map(([route]) => route)
      .filter((route) => !rootStackRoutes.includes(route) && !appScreens.includes(route));
    const emptyReasons = exclusionEntries
      .filter(([, reason]) => reason.trim().length === 0)
      .map(([route]) => route);
    const staleNativeHeaderRoutes = nativeHeaderRootRoutes.filter(
      (route) => !rootStackRoutes.includes(route) && !appScreens.includes(route),
    );
    const nativeHeaderRoutesWithHiddenHeader = nativeHeaderRootRoutes.filter((route) => {
      const block = getStackScreenBlock(appSource, route);
      return !block || /headerShown:\s*false/.test(block);
    });

    if (
      missingNativeTabsRoutes.length > 0 ||
      staleExclusions.length > 0 ||
      emptyReasons.length > 0 ||
      staleNativeHeaderRoutes.length > 0 ||
      nativeHeaderRoutesWithHiddenHeader.length > 0
    ) {
      failNativeHeaderContract(
        [
          `Missing native tabs registrations for React Navigation routes: ${formatList(missingNativeTabsRoutes)}.`,
          `Stale native-tabs exclusion entries: ${formatList(staleExclusions)}.`,
          `Native-tabs exclusions missing a reason: ${formatList(emptyReasons)}.`,
          `Stale native-header root route entries: ${formatList(staleNativeHeaderRoutes)}.`,
          `Native-header root routes with headerShown: false or no App.tsx Stack.Screen block: ${formatList(nativeHeaderRoutesWithHiddenHeader)}.`,
        ].join('\n'),
      );
    }
  });

  it('keeps TabParamList aligned with native and fallback tab navigators', () => {
    const tabRoutes = extractTypeKeys(navigationSource, 'TabParamList');
    const nativeTabScreens = extractScreenNames(tabsSource, 'NativeTab');
    const fallbackTabScreens = extractScreenNames(tabsSource, 'FallbackTab');

    const missingNativeTabs = missingFrom(tabRoutes, nativeTabScreens);
    const staleNativeTabs = unexpectedFrom(tabRoutes, nativeTabScreens);
    const missingFallbackTabs = missingFrom(tabRoutes, fallbackTabScreens);
    const staleFallbackTabs = unexpectedFrom(tabRoutes, fallbackTabScreens);

    if (
      missingNativeTabs.length > 0 ||
      staleNativeTabs.length > 0 ||
      missingFallbackTabs.length > 0 ||
      staleFallbackTabs.length > 0
    ) {
      failNativeHeaderContract(
        [
          'TabParamList and TabsLayout.tsx are out of sync.',
          `TabParamList routes missing from NativeTab.Screen: ${formatList(missingNativeTabs)}.`,
          `NativeTab.Screen entries missing from TabParamList: ${formatList(staleNativeTabs)}.`,
          `TabParamList routes missing from FallbackTab.Screen: ${formatList(missingFallbackTabs)}.`,
          `FallbackTab.Screen entries missing from TabParamList: ${formatList(staleFallbackTabs)}.`,
        ].join('\n'),
      );
    }
  });

  it('keeps native iOS tab content inside tab-local native stacks', () => {
    const nonAddTabsMatch = tabsSource.match(
      /export const NON_ADD_TABS = \[([^\]]+)\] as const;/,
    );
    const nonAddTabs = nonAddTabsMatch
      ? [...nonAddTabsMatch[1].matchAll(/'([^']+)'/g)].map((item) => item[1])
      : [];

    const nativeTabScreens = extractScreenNames(tabsSource, 'NativeTab');
    const missingContentTabs = missingFrom(
      nonAddTabs,
      nativeTabScreens.filter((name) => name !== 'Add'),
    );
    const missingStackScreens = nonAddTabs.filter(
      (name) =>
        !new RegExp(`function ${name}StackScreen\\(`).test(tabsSource) ||
        !new RegExp(`${name}Stack\\.Navigator[\\s\\S]*${name}Stack\\.Screen`).test(
          tabsSource,
        ) ||
        !new RegExp(`${name}Stack\\.Screen[\\s\\S]*title: '${name}'`).test(
          tabsSource,
        ),
    );

    if (missingContentTabs.length > 0 || missingStackScreens.length > 0) {
      failNativeHeaderContract(
        [
          'Native iOS tab content is not fully wired through tab-local native stacks.',
          `Content tabs missing from NativeTab.Screen: ${formatList(missingContentTabs)}.`,
          `Content tabs missing a ${'<Tab>'}StackScreen with ${'<Tab>'}Stack.Navigator, ${'<Tab>'}Stack.Screen, and a matching native title: ${formatList(missingStackScreens)}.`,
        ].join('\n'),
      );
    }
  });

  it('hides screen-owned React headers on iOS when native header items are used', () => {
    const unguardedReactHeaders = NATIVE_HEADER_SCREENS_WITH_REACT_HEADER.filter(
      (relativePath) => {
        const source = readMobileFile(relativePath);
        return !hidesReactHeaderOnIOS(source);
      },
    );
    const listedFiles = new Set<string>(NATIVE_HEADER_SCREENS_WITH_REACT_HEADER);
    const unlistedPotentialReactHeaders = fs
      .readdirSync(path.join(mobileRoot, 'src/screens'))
      .filter((fileName) => fileName.endsWith('.tsx'))
      .map((fileName) => `src/screens/${fileName}`)
      .filter((relativePath) => {
        if (listedFiles.has(relativePath)) return false;
        const source = readMobileFile(relativePath);
        return hasNativeHeaderItems(source) && hasPotentialReactHeader(source);
      });

    if (unguardedReactHeaders.length > 0 || unlistedPotentialReactHeaders.length > 0) {
      failNativeHeaderContract(
        [
          'Native header items and screen-owned React headers can render at the same time on iOS.',
          `Screens listed as having both native header items and a React header but missing an iOS suppression guard: ${formatList(unguardedReactHeaders)}.`,
          `Screens with native header items and a likely React header that are not covered by NATIVE_HEADER_SCREENS_WITH_REACT_HEADER: ${formatList(unlistedPotentialReactHeaders)}.`,
        ].join('\n'),
      );
    }
  });
});
