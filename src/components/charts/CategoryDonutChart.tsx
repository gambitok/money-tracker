import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Circle, G } from 'react-native-svg';

type Datum = { x: string; y: number; color: string };

export function CategoryDonutChart(props: {
  data: Datum[];
  total: string;
  subtitle: string;
  size?: number;
}) {
  const theme = useTheme();
  const size = props.size ?? 250;

  if (props.data.length === 0) return null;

  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const totalValue = props.data.reduce((sum, item) => sum + item.y, 0);
  let cumulativeOffset = 0;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.surfaceVariant}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {props.data.map((item) => {
            const segmentLength = totalValue > 0 ? (item.y / totalValue) * circumference : 0;
            const circle = (
              <Circle
                key={item.x}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-cumulativeOffset}
                strokeLinecap="butt"
              />
            );

            cumulativeOffset += segmentLength;
            return circle;
          })}
        </G>
      </Svg>

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          maxWidth: size * 0.46,
        }}>
        <Text variant="titleLarge" style={{ fontWeight: '700', textAlign: 'center' }}>
          {props.total}
        </Text>
        <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>{props.subtitle}</Text>
      </View>
    </View>
  );
}
