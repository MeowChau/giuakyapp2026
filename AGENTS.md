# FootballFieldApp

These project rules apply to all application changes, including work guided by
the installed mobile-design skill.

## Libraries

- React and React Native are the core framework dependencies.
- The only permitted additional direct runtime libraries are:
  - `@react-navigation/native`
  - `@react-navigation/native-stack`
  - `react-native-screens`
  - `react-native-safe-area-context`
  - `@react-native-async-storage/async-storage`
  - `react-native-vector-icons` (optional)
- Install permitted libraries only when the feature needs them. Their required
  transitive dependencies and the existing development/build tools are allowed.
- Do not use ready-made UI libraries, including NativeBase, React Native Paper,
  or UI Kitten. Build the UI with React Native components and `StyleSheet`.
- Skill suggestions must stay within this library list.

## Delete confirmation

- Every action that deletes application data must first show a React Native
  `Alert.alert` confirmation, including individual, bulk, and clear-all actions.
- Provide a cancel button (`Hủy`, `style: 'cancel'`) and a confirmation button
  (`Xoá`, `style: 'destructive'`).
- Perform the deletion only inside the confirmation button's `onPress` handler.
- Cancelling or dismissing the alert must leave data unchanged.
