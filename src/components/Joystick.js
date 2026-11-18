import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { joystickVector } from '../services/protocol';
import { colors } from '../theme';

/**
 * Joystick vetorial (mesma lógica da página web): devolve x,y de -100 a 100.
 * onStart → dedo encostou | onMove(x,y) → arrastou | onEnd → soltou
 */
export default function Joystick({ size = 240, onStart, onMove, onEnd }) {
  const [knob, setKnob] = useState({ dx: 0, dy: 0 });
  const radius = (size / 2) * 0.78;
  const cb = useRef({ onStart, onMove, onEnd });
  cb.current = { onStart, onMove, onEnd };

  const responder = useMemo(() => {
    const update = (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const v = joystickVector(locationX - size / 2, locationY - size / 2, radius);
      setKnob({ dx: v.dx, dy: v.dy });
      cb.current.onMove?.(v.x, v.y);
    };
    const release = () => {
      setKnob({ dx: 0, dy: 0 });
      cb.current.onMove?.(0, 0);
      cb.current.onEnd?.();
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        update(e);
        cb.current.onStart?.();
      },
      onPanResponderMove: update,
      onPanResponderRelease: release,
      onPanResponderTerminate: release,
    });
  }, [size, radius]);

  const k = size * 0.34;
  return (
    <View
      testID="joystick"
      style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}
      {...responder.panHandlers}
    >
      <View pointerEvents="none" style={[styles.lineV, { left: size / 2 }]} />
      <View pointerEvents="none" style={[styles.lineH, { top: size / 2 }]} />
      <View
        pointerEvents="none"
        style={[
          styles.knob,
          {
            width: k,
            height: k,
            borderRadius: k / 2,
            left: size / 2 - k / 2,
            top: size / 2 - k / 2,
            transform: [{ translateX: knob.dx }, { translateY: knob.dy }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'center',
  },
  lineV: { position: 'absolute', top: '8%', bottom: '8%', width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  lineH: { position: 'absolute', left: '8%', right: '8%', height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  knob: {
    position: 'absolute',
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.primary,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
});
