import { Platform, View } from 'react-native';
import { Text } from 'react-native-paper';
import { VictoryLabel, VictoryPie } from 'victory-native';

type Datum = { x: string; y: number };

export function ExpensePieChart(props: { data: Datum[]; size?: number }) {
  const size = props.size ?? 240;

  if (props.data.length === 0) return null;
  if (Platform.OS === 'web') {
    return <Text style={{ opacity: 0.7, marginTop: 8 }}>Charts are available in the mobile app.</Text>;
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <VictoryPie
        data={props.data}
        width={size}
        height={size}
        innerRadius={60}
        padAngle={1}
        labels={({ datum }) => `${datum.x}`}
        labelComponent={<VictoryLabel style={{ fontSize: 10 }} />}
      />
    </View>
  );
}

