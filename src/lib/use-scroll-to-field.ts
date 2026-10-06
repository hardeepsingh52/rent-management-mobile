import { useCallback, useRef } from "react";
import type { ScrollView, View } from "react-native";

// Lets a form scroll to a field (usually the first one with an error).
// Attach `scrollRef` to the ScrollView and `register("field")` as the `ref` of
// a View wrapping that field.
export function useScrollToField<K extends string>() {
  const scrollRef = useRef<ScrollView>(null);
  const fields = useRef<Partial<Record<K, View>>>({});

  const register = useCallback(
    (key: K) => (node: View | null) => {
      if (node) {
        fields.current[key] = node;
      } else {
        delete fields.current[key];
      }
    },
    [],
  );

  const scrollToField = useCallback((key: K) => {
    const scroll = scrollRef.current;
    const node = fields.current[key];
    // The inner content view is the reference the field's position is measured
    // against. getInnerViewRef (host ref) is what the new architecture needs;
    // it isn't in the public typings, so fall back to the typed method.
    const inner =
      (
        scroll as unknown as { getInnerViewRef?: () => View | null }
      )?.getInnerViewRef?.() ?? scroll?.getInnerViewNode();
    if (!scroll || !node || !inner) {
      return;
    }
    node.measureLayout(
      inner,
      (_x, y) => scroll.scrollTo({ y: Math.max(y - 16, 0), animated: true }),
      () => {},
    );
  }, []);

  return { scrollRef, register, scrollToField };
}
