/**
 * In-app sortable list: DndProvider + DraggableStack + Draggable merged into
 * Sortable + SortableItem (based on @mgcrea/react-native-dnd dist sources).
 * Internal ids are namespaced per Sortable instance so multiple lists do not collide.
 */
import React, {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { Gesture, GestureDetector, State } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";

// --- delimiter: unlikely in user ids (e.g. UUID / numeric string ids) ---
const ID_SEP = "\uE000";

// ---------------------------------------------------------------------------
// Drag / drop UI context (scroll lock, etc.)
// ---------------------------------------------------------------------------

type DragDropContextValue = {
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
};

export const DragDropContext = createContext<DragDropContextValue>({
  isDragging: false,
  setIsDragging: () => {},
});

export function useDragDrop() {
  return useContext(DragDropContext);
}

export const DragDropProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const value = useMemo(
    () => ({ isDragging, setIsDragging }),
    [isDragging],
  );
  return (
    <DragDropContext.Provider value={value}>{children}</DragDropContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Worklet utils (geometry + arrays)
// ---------------------------------------------------------------------------

type Layout = { x: number; y: number; width: number; height: number };

function includesPoint(
  layout: Layout,
  { x, y }: { x: number; y: number },
  strict?: boolean,
): boolean {
  "worklet";
  if (strict) {
    return (
      layout.x < x &&
      x < layout.x + layout.width &&
      layout.y < y &&
      y < layout.y + layout.height
    );
  }
  return (
    layout.x <= x &&
    x <= layout.x + layout.width &&
    layout.y <= y &&
    y <= layout.y + layout.height
  );
}

function centerAxis(layout: Layout, direction: "horizontal" | "vertical") {
  "worklet";
  return direction === "horizontal"
    ? layout.x + layout.width / 2
    : layout.y + layout.height / 2;
}

function overlapsAxis(
  layout: Layout,
  axis: number,
  direction: "horizontal" | "vertical",
) {
  "worklet";
  return direction === "horizontal"
    ? layout.x < axis && layout.x + layout.width > axis
    : layout.y < axis && layout.y + layout.height > axis;
}

function doesOverlapOnAxis(
  activeLayout: Layout,
  itemLayout: Layout,
  direction: "horizontal" | "vertical",
) {
  "worklet";
  const itemCenterAxis = centerAxis(itemLayout, direction);
  return overlapsAxis(activeLayout, itemCenterAxis, direction);
}

function applyOffset(layout: Layout, { x, y }: { x: number; y: number }) {
  "worklet";
  return {
    width: layout.width,
    height: layout.height,
    x: layout.x + x,
    y: layout.y + y,
  };
}

function arraysEqual(a: string[], b: string[]) {
  "worklet";
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function moveArrayIndex(input: string[], from: number, to: number) {
  "worklet";
  const output = input.slice();
  output.splice(to, 0, output.splice(from, 1)[0]!);
  return output;
}

function getDistance(x: number, y: number) {
  "worklet";
  return Math.sqrt(Math.abs(x) ** 2 + Math.abs(y) ** 2);
}

function overlapsRectangle(layout: Layout, other: Layout) {
  "worklet";
  return (
    layout.x < other.x + other.width &&
    layout.x + layout.width > other.x &&
    layout.y < other.y + other.height &&
    layout.y + layout.height > other.y
  );
}

function waitForAll(
  callback: (
    a: readonly [boolean, number],
    b: readonly [boolean, number],
  ) => void,
  count = 2,
) {
  "worklet";
  const status = new Array(count).fill(false);
  const result: unknown[][] = new Array(count).fill(undefined);
  return status.map((_v, index) => {
    return (...args: unknown[]) => {
      status[index] = true;
      result[index] = args;
      if (status.every(Boolean)) {
        callback(
          result[0] as [boolean, number],
          result[1] as [boolean, number],
        );
      }
    };
  });
}

function animatePointWithSpring(
  point: { x: SharedValue<number>; y: SharedValue<number> },
  [toValueX, toValueY]: [number, number],
  [configX, configY]: [object | undefined, object | undefined] = [
    undefined,
    undefined,
  ],
  callback?: (finished: [boolean, boolean]) => void,
) {
  "worklet";
  const [waitForX, waitForY] = waitForAll(
    ([finishedX], [finishedY]) => {
      if (!callback) return;
      callback([finishedX, finishedY]);
    },
  );
  point.x.value = withSpring(toValueX, configX, waitForX);
  point.y.value = withSpring(toValueY, configY, waitForY);
}

// ---------------------------------------------------------------------------
// Small hooks
// ---------------------------------------------------------------------------

function useSharedPoint(x: number, y: number) {
  return {
    x: useSharedValue(x),
    y: useSharedValue(y),
  };
}

function useEvent<T extends (...args: unknown[]) => unknown>(handler: T) {
  const handlerRef = useRef(handler);
  useLayoutEffect(() => {
    handlerRef.current = handler;
  });
  return useCallback((...args: Parameters<T>) => {
    return handlerRef.current?.(...args) as ReturnType<T>;
  }, []);
}

function isReanimatedSharedValue(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "_isReanimatedSharedValue" in value &&
    (value as { _isReanimatedSharedValue?: boolean })._isReanimatedSharedValue ===
      true
  );
}

function useLatestSharedValue<T>(value: T, dependencies: unknown[] = [value]) {
  const sharedValue = useSharedValue(value);
  useAnimatedReaction(
    () => value,
    (next, prev) => {
      if (prev === null) return;
      sharedValue.value = next;
    },
    dependencies,
  );
  return sharedValue;
}

// ---------------------------------------------------------------------------
// Internal DnD context (one Sortable = one provider)
// ---------------------------------------------------------------------------

type DraggableStateSV = SharedValue<
  "resting" | "pending" | "dragging" | "acting" | "sleeping"
>;

export type SortableDndContextValue = {
  containerRef: React.RefObject<View | null>;
  draggableLayouts: SharedValue<Record<string, SharedValue<Layout>>>;
  droppableLayouts: SharedValue<Record<string, SharedValue<Layout>>>;
  draggableOptions: SharedValue<
    Record<
      string,
      {
        id: string;
        data: SharedValue<Record<string, unknown>>;
        disabled: boolean;
        activationDelay: number;
        activationTolerance: number;
      }
    >
  >;
  droppableOptions: SharedValue<Record<string, { disabled: boolean }>>;
  draggableOffsets: SharedValue<
    Record<string, { x: SharedValue<number>; y: SharedValue<number> }>
  >;
  draggableRestingOffsets: SharedValue<
    Record<string, { x: SharedValue<number>; y: SharedValue<number> }>
  >;
  draggableStates: SharedValue<Record<string, DraggableStateSV>>;
  draggablePendingId: SharedValue<string | null>;
  draggableActiveId: SharedValue<string | null>;
  droppableActiveId: SharedValue<string | null>;
  panGestureState: SharedValue<number>;
  draggableInitialOffset: { x: SharedValue<number>; y: SharedValue<number> };
  draggableActiveLayout: SharedValue<Layout | null>;
  draggableContentOffset: { x: SharedValue<number>; y: SharedValue<number> };
};

const SortableDndContext = createContext<SortableDndContextValue | null>(null);

function useSortableDndContext(): SortableDndContextValue {
  const ctx = useContext(SortableDndContext);
  if (!ctx) {
    throw new Error("SortableItem must be used inside Sortable");
  }
  return ctx;
}

type SortableInstanceContextValue = {
  instancePrefix: string;
  toInternalId: (userId: string) => string;
  toUserId: (internalId: string) => string;
};

const SortableInstanceContext =
  createContext<SortableInstanceContextValue | null>(null);

function useSortableInstance(): SortableInstanceContextValue {
  const ctx = useContext(SortableInstanceContext);
  if (!ctx) {
    throw new Error("SortableItem must be used inside Sortable");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// useSortableDraggable (useDraggable with internal id registration)
// ---------------------------------------------------------------------------

function useSortableDraggable({
  userId,
  data = {},
  disabled = false,
  activationDelay = 0,
  activationTolerance = Number.POSITIVE_INFINITY,
}: {
  userId: string;
  data?: Record<string, unknown> | SharedValue<Record<string, unknown>>;
  disabled?: boolean;
  activationDelay?: number;
  activationTolerance?: number;
}) {
  const { toInternalId } = useSortableInstance();
  const id = useMemo(() => toInternalId(userId), [toInternalId, userId]);

  const {
    draggableLayouts,
    draggableOffsets,
    draggableRestingOffsets,
    draggableOptions,
    draggableStates,
    draggableActiveId,
    draggablePendingId,
    containerRef,
    panGestureState,
  } = useSortableDndContext();

  const ref = useRef<View>(null);
  const recordForLatest = isReanimatedSharedValue(data)
    ? ({} as Record<string, unknown>)
    : data;
  const dataFromLatest = useLatestSharedValue(recordForLatest, [data]);
  const sharedData = (
    isReanimatedSharedValue(data) ? data : dataFromLatest
  ) as SharedValue<Record<string, unknown>>;

  const layout = useSharedValue<Layout>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const offset = useSharedPoint(0, 0);
  const restingOffset = useSharedPoint(0, 0);
  const state = useSharedValue<
    "resting" | "pending" | "dragging" | "acting" | "sleeping"
  >("resting");

  draggableStates.value[id] = state;

  useLayoutEffect(() => {
    const runLayoutEffect = () => {
      "worklet";
      requestAnimationFrame(() => {
        draggableLayouts.value[id] = layout;
        draggableOffsets.value[id] = offset;
        draggableRestingOffsets.value[id] = restingOffset;
        draggableStates.value[id] = state;
        draggableOptions.value[id] = {
          id,
          data: sharedData,
          disabled,
          activationDelay,
          activationTolerance,
        };
      });
    };
    runOnUI(runLayoutEffect)();
    return () => {
      const cleanupLayoutEffect = () => {
        "worklet";
        requestAnimationFrame(() => {
          delete draggableLayouts.value[id];
          delete draggableOffsets.value[id];
          delete draggableRestingOffsets.value[id];
          delete draggableOptions.value[id];
          delete draggableStates.value[id];
        });
      };
      runOnUI(cleanupLayoutEffect)();
    };
  }, [id]);

  const onLayout = useEvent(() => {
    if (!ref.current || !containerRef.current) return;
    ref.current.measureLayout(
      containerRef.current,
      (x, y, width, height) => {
        layout.value = { x, y, width, height };
      },
      () => {},
    );
  });

  useAnimatedReaction(
    () => disabled,
    (next, prev) => {
      if (next !== prev && draggableOptions.value[id]) {
        draggableOptions.value[id].disabled = disabled;
      }
    },
    [disabled, id],
  );

  const props = useMemo(
    () => ({
      ref,
      onLayout,
    }),
    [onLayout],
  );

  return {
    offset,
    state,
    activeId: draggableActiveId,
    pendingId: draggablePendingId,
    props,
    panGestureState,
  };
}

// ---------------------------------------------------------------------------
// useDraggableSort + useDraggableStack
// ---------------------------------------------------------------------------

function useDraggableSort({
  horizontal = false,
  childrenIds,
  onOrderChange,
  onOrderUpdate,
  shouldSwapWorklet = doesOverlapOnAxis,
}: {
  horizontal?: boolean;
  childrenIds: string[];
  onOrderChange?: (order: string[]) => void;
  onOrderUpdate?: (next: string[], prev: string[]) => void;
  shouldSwapWorklet?: (
    active: Layout,
    item: Layout,
    direction: "horizontal" | "vertical",
  ) => boolean;
}) {
  const { draggableActiveId, draggableActiveLayout, draggableOffsets, draggableLayouts } =
    useSortableDndContext();

  const direction = horizontal ? "horizontal" : "vertical";
  const draggablePlaceholderIndex = useSharedValue(-1);
  const draggableLastOrder = useSharedValue(childrenIds);
  const draggableSortOrder = useSharedValue(childrenIds);

  const findPlaceholderIndex = (activeLayout: Layout) => {
    "worklet";
    const activeId = draggableActiveId.value;
    const layouts = draggableLayouts.value;
    const offsets = draggableOffsets.value;
    const sortOrder = draggableSortOrder.value;
    const activeIndex = sortOrder.findIndex((i) => i === activeId);

    for (let itemIndex = 0; itemIndex < sortOrder.length; itemIndex++) {
      const itemId = sortOrder[itemIndex];
      if (itemId === activeId) continue;
      if (!layouts[itemId]) continue;
      const itemLayout = applyOffset(layouts[itemId]!.value, {
        x: offsets[itemId]!.x.value,
        y: offsets[itemId]!.y.value,
      });
      if (shouldSwapWorklet(activeLayout, itemLayout, direction)) {
        return itemIndex;
      }
    }
    return activeIndex;
  };

  useAnimatedReaction(
    () => childrenIds,
    (next, prev) => {
      if (prev === null) return;

      // Empty → first items: initialise order (upstream skipped prev.length === 0)
      if (prev.length === 0 && next.length > 0) {
        draggableSortOrder.value = next.slice();
        draggableLastOrder.value = next.slice();
        return;
      }

      if (prev.length === 0) return;

      if (
        next.length === prev.length &&
        arraysEqual(prev.slice().sort(), next.slice().sort()) &&
        !arraysEqual(prev, next)
      ) {
        draggableSortOrder.value = next.slice();
        draggableLastOrder.value = next.slice();
        draggablePlaceholderIndex.value = -1;
        draggableActiveLayout.value = null;
        if (
          draggableActiveId.value !== null &&
          !next.includes(draggableActiveId.value)
        ) {
          draggableActiveId.value = null;
        }
        return;
      }

      const removedIds = prev.filter((id) => !next.includes(id));
      if (removedIds.length > 0) {
        draggableSortOrder.value = draggableSortOrder.value.filter(
          (itemId) => !removedIds.includes(itemId),
        );
      }

      const layouts = draggableLayouts.value;
      const addedIds = next.filter((id) => !prev.includes(id));
      addedIds.forEach((addId) => {
        const positionEntries = Object.entries(layouts).map(([key, l]) => [
          key,
          l.value[horizontal ? "x" : "y"],
        ]) as [string, number][];
        positionEntries.sort((a, b) => a[1] - b[1]);
        const index = positionEntries.findIndex(([key]) => key === addId);
        const nextOrder = draggableSortOrder.value.slice();
        if (index < 0) {
          nextOrder.push(addId);
        } else {
          nextOrder.splice(index, 0, addId);
        }
        draggableSortOrder.value = nextOrder;
      });

      if (
        onOrderChange &&
        (removedIds.length > 0 || addedIds.length > 0)
      ) {
        runOnJS(onOrderChange)(draggableSortOrder.value.slice());
      }
    },
    [childrenIds, onOrderChange],
  );

  useAnimatedReaction(
    () =>
      [draggableActiveId.value, draggableActiveLayout.value] as const,
    (curr, prev) => {
      if (prev === null) return;
      const [nextActiveId, nextActiveLayout] = curr;
      if (nextActiveLayout === null) return;
      if (nextActiveId === null) {
        draggablePlaceholderIndex.value = -1;
        return;
      }
      if (!childrenIds.includes(nextActiveId)) return;
      draggablePlaceholderIndex.value = findPlaceholderIndex(nextActiveLayout);
    },
    [childrenIds],
  );

  useAnimatedReaction(
    () =>
      [draggableActiveId.value, draggablePlaceholderIndex.value] as const,
    (next, prev) => {
      if (prev === null) return;
      const [_prevActiveId, prevPlaceholderIndex] = prev;
      const [nextActiveId, nextPlaceholderIndex] = next;
      const prevOrder = draggableSortOrder.value;

      if (prevPlaceholderIndex !== -1 && nextPlaceholderIndex === -1) {
        if (nextActiveId === null && onOrderChange) {
          if (!arraysEqual(prevOrder, draggableLastOrder.value)) {
            runOnJS(onOrderChange)(prevOrder.slice());
          }
          draggableLastOrder.value = prevOrder.slice();
        }
      }

      if (prevPlaceholderIndex === -1 || nextPlaceholderIndex === -1) return;

      const moved = moveArrayIndex(
        prevOrder,
        prevPlaceholderIndex,
        nextPlaceholderIndex,
      );
      if (onOrderUpdate) {
        runOnJS(onOrderUpdate)(moved, prevOrder.slice());
      }
      draggableSortOrder.value = moved;
    },
    [onOrderChange, onOrderUpdate],
  );

  return { draggablePlaceholderIndex, draggableSortOrder };
}

function useDraggableStack({
  childrenIds,
  onOrderChange,
  onOrderUpdate,
  gap = 0,
  horizontal = false,
  shouldSwapWorklet = doesOverlapOnAxis,
}: {
  childrenIds: string[];
  onOrderChange?: (order: string[]) => void;
  onOrderUpdate?: (next: string[], prev: string[]) => void;
  gap?: number;
  horizontal?: boolean;
  shouldSwapWorklet?: typeof doesOverlapOnAxis;
}) {
  const {
    draggableStates,
    draggableActiveId,
    draggableOffsets,
    draggableRestingOffsets,
    draggableLayouts,
  } = useSortableDndContext();

  const axis = horizontal ? "x" : "y";
  const size = horizontal ? "width" : "height";

  const { draggableSortOrder } = useDraggableSort({
    horizontal,
    childrenIds,
    onOrderChange,
    onOrderUpdate,
    shouldSwapWorklet,
  });

  const computeOffsetsForItem = useCallback(
    (itemId: string) => {
      "worklet";
      const layouts = draggableLayouts.value;
      const sortOrder = draggableSortOrder.value;
      const nextIndex = sortOrder.findIndex((i) => i === itemId);
      const prevIndex = childrenIds.findIndex((i) => i === itemId);
      let offset = 0;

      for (let nextSiblingIndex = 0; nextSiblingIndex < sortOrder.length; nextSiblingIndex++) {
        const siblingId = sortOrder[nextSiblingIndex];
        if (siblingId === itemId) continue;
        if (!layouts[siblingId]) continue;
        const prevSiblingIndex = childrenIds.findIndex((i) => i === siblingId);
        if (nextSiblingIndex < nextIndex && prevSiblingIndex > prevIndex) {
          offset += layouts[siblingId]!.value[size] + gap;
        } else if (nextSiblingIndex > nextIndex && prevSiblingIndex < prevIndex) {
          offset -= layouts[siblingId]!.value[size] + gap;
        }
      }
      return offset;
    },
    [draggableLayouts, draggableSortOrder, gap, horizontal, childrenIds, size],
  );

  const refreshOffsets = useCallback(() => {
    "worklet";
    requestAnimationFrame(() => {
      const ax = horizontal ? "x" : "y";
      const offsets = draggableOffsets.value;
      const restingOffsets = draggableRestingOffsets.value;
      const sortOrder = draggableSortOrder.value;

      for (const iid of sortOrder) {
        if (!offsets[iid]) continue;
        const o = offsets[iid]!;
        const r = restingOffsets[iid]!;
        cancelAnimation(o[ax]);
        const next = computeOffsetsForItem(iid);
        o[ax].value = next;
        r[ax].value = next;
      }
    });
  }, [
    computeOffsetsForItem,
    draggableOffsets,
    draggableRestingOffsets,
    draggableSortOrder,
    horizontal,
  ]);

  const resetSortOrder = useCallback(() => {
    draggableSortOrder.value = childrenIds.slice();
    refreshOffsets();
  }, [childrenIds, draggableSortOrder, refreshOffsets]);

  useAnimatedReaction(
    () => childrenIds,
    (next, prev) => {
      if (prev === null) return;
      if (arraysEqual(next, prev)) return;
      refreshOffsets();
    },
    [childrenIds],
  );

  useAnimatedReaction(
    () => draggableSortOrder.value,
    (nextOrder, prevOrder) => {
      if (prevOrder === null) return;
      const activeId = draggableActiveId.value;
      const layouts = draggableLayouts.value;
      const offsets = draggableOffsets.value;
      const restingOffsets = draggableRestingOffsets.value;
      if (!activeId) return;
      const activeLayout = layouts[activeId]!.value;
      const prevActiveIndex = prevOrder.findIndex((i) => i === activeId);
      const nextActiveIndex = nextOrder.findIndex((i) => i === activeId);
      const nextActiveOffset = { x: 0, y: 0 };
      const restingOffset = restingOffsets[activeId]!;

      for (let nextIndex = 0; nextIndex < nextOrder.length; nextIndex++) {
        const iid = nextOrder[nextIndex];
        if (iid === activeId) continue;
        const prevIndex = prevOrder.findIndex((i) => i === iid);
        if (nextIndex === prevIndex) continue;
        const moveCol = nextIndex - prevIndex;
        offsets[iid]![axis].value =
          restingOffsets[iid]![axis].value +
          moveCol * (activeLayout[size] + gap);
        restingOffsets[iid]![axis].value = offsets[iid]![axis].value;
        if (nextIndex < nextActiveIndex && prevIndex > prevActiveIndex) {
          nextActiveOffset[axis] += layouts[iid]!.value[size] + gap;
        } else if (nextIndex > nextActiveIndex && prevIndex < prevActiveIndex) {
          nextActiveOffset[axis] -= layouts[iid]!.value[size] + gap;
        }
      }
      restingOffset[axis].value += nextActiveOffset[axis];
    },
    [axis, gap, horizontal, size],
  );

  return { draggableSortOrder, resetSortOrder, refreshOffsets };
}

/** Runs stack hooks under SortableDndContext — hooks cannot run in Sortable before Provider mounts. */
type SortableInnerProps = {
  gap: number;
  horizontal: boolean;
  childrenIds: string[];
  onOrderChangeUser?: (order: string[]) => void;
  onOrderUpdateUser?: (next: string[], prev: string[]) => void;
  shouldSwapWorklet?: typeof doesOverlapOnAxis;
  children: React.ReactNode;
};

const SortableInner = forwardRef<
  { refreshOffsets: () => void; resetSortOrder: () => void },
  SortableInnerProps
>(function SortableInner(
  {
    gap,
    horizontal,
    childrenIds,
    onOrderChangeUser,
    onOrderUpdateUser,
    shouldSwapWorklet,
    children,
  },
  ref,
) {
  const { refreshOffsets, resetSortOrder } = useDraggableStack({
    gap,
    horizontal,
    childrenIds,
    onOrderChange: onOrderChangeUser,
    onOrderUpdate: onOrderUpdateUser,
    shouldSwapWorklet,
  });

  useImperativeHandle(
    ref,
    () => ({
      refreshOffsets: () => runOnUI(refreshOffsets)(),
      resetSortOrder: () => runOnUI(resetSortOrder)(),
    }),
    [refreshOffsets, resetSortOrder],
  );

  useEffect(() => {
    runOnUI(refreshOffsets)();
  }, [childrenIds, refreshOffsets]);

  return <>{children}</>;
});

// ---------------------------------------------------------------------------
// Sortable (DndProvider + DraggableStack)
// ---------------------------------------------------------------------------

export type SortableProps = {
  children: React.ReactNode;
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
  gap?: number;
  style?: StyleProp<ViewStyle>;
  onOrderChange?: (order: string[]) => void;
  onOrderUpdate?: (next: string[], prev: string[]) => void;
  shouldSwapWorklet?: typeof doesOverlapOnAxis;
  /** Forwarded to root pan gesture (ms). */
  activationDelay?: number;
  minDistance?: number;
  disabled?: boolean;
  springConfig?: {
    damping?: number;
    mass?: number;
    stiffness?: number;
    overshootClamping?: boolean;
    restSpeedThreshold?: number;
    restDisplacementThreshold?: number;
  };
  debug?: boolean;
};

export const Sortable = forwardRef(function Sortable(
  {
    children,
    direction = "row",
    gap = 0,
    style: styleProp,
    onOrderChange,
    onOrderUpdate,
    shouldSwapWorklet,
    activationDelay: rootActivationDelay = 0,
    minDistance = 0,
    disabled = false,
    springConfig = {},
    debug = false,
  }: SortableProps,
  ref: React.Ref<{ refreshOffsets: () => void; resetSortOrder: () => void }>,
) {
  const reactInstanceId = useId();
  const instancePrefix = `${reactInstanceId}${ID_SEP}`;

  const toInternalId = useCallback(
    (userId: string) => `${instancePrefix}${userId}`,
    [instancePrefix],
  );

  const toUserId = useCallback(
    (internalId: string) =>
      internalId.startsWith(instancePrefix)
        ? internalId.slice(instancePrefix.length)
        : internalId,
    [instancePrefix],
  );

  const instanceCtx = useMemo(
    () => ({ instancePrefix, toInternalId, toUserId }),
    [instancePrefix, toInternalId, toUserId],
  );

  const childrenIds = useMemo(() => {
    return Children.toArray(children)
      .filter(isValidElement)
      .map((c) => {
        const p = (c.props as { id?: string }).id;
        return p != null ? toInternalId(String(p)) : null;
      })
      .filter((x): x is string => x != null);
  }, [children, toInternalId]);

  const onOrderChangeUser = onOrderChange
    ? (internalOrder: string[]) => {
        onOrderChange(internalOrder.map(toUserId));
      }
    : undefined;

  const onOrderUpdateUser = onOrderUpdate
    ? (next: string[], prev: string[]) => {
        onOrderUpdate(next.map(toUserId), prev.map(toUserId));
      }
    : undefined;

  const containerRef = useRef<View>(null);
  const draggableLayouts = useSharedValue<
    Record<string, SharedValue<Layout>>
  >({});
  const droppableLayouts = useSharedValue<
    Record<string, SharedValue<Layout>>
  >({});
  const draggableOptions = useSharedValue<
    Record<
      string,
      {
        id: string;
        data: SharedValue<Record<string, unknown>>;
        disabled: boolean;
        activationDelay: number;
        activationTolerance: number;
      }
    >
  >({});
  const droppableOptions = useSharedValue<Record<string, { disabled: boolean }>>(
    {},
  );
  const draggableOffsets = useSharedValue<
    Record<string, { x: SharedValue<number>; y: SharedValue<number> }>
  >({});
  const draggableRestingOffsets = useSharedValue<
    Record<string, { x: SharedValue<number>; y: SharedValue<number> }>
  >({});
  const draggableStates = useSharedValue<Record<string, DraggableStateSV>>({});
  const draggablePendingId = useSharedValue<string | null>(null);
  const draggableActiveId = useSharedValue<string | null>(null);
  const droppableActiveId = useSharedValue<string | null>(null);
  const draggableActiveLayout = useSharedValue<Layout | null>(null);
  const draggableInitialOffset = useSharedPoint(0, 0);
  const draggableContentOffset = useSharedPoint(0, 0);
  const panGestureState = useSharedValue(0);

  const dndContextValue = useRef<SortableDndContextValue>({
    containerRef,
    draggableLayouts,
    droppableLayouts,
    draggableOptions,
    droppableOptions,
    draggableOffsets,
    draggableRestingOffsets,
    draggableStates,
    draggablePendingId,
    draggableActiveId,
    droppableActiveId,
    panGestureState,
    draggableInitialOffset,
    draggableActiveLayout,
    draggableContentOffset,
  });
  dndContextValue.current = {
    containerRef,
    draggableLayouts,
    droppableLayouts,
    draggableOptions,
    droppableOptions,
    draggableOffsets,
    draggableRestingOffsets,
    draggableStates,
    draggablePendingId,
    draggableActiveId,
    droppableActiveId,
    panGestureState,
    draggableInitialOffset,
    draggableActiveLayout,
    draggableContentOffset,
  };

  const setDraggingRef = useRef<(v: boolean) => void>(() => {});
  const dragDrop = useContext(DragDropContext);
  setDraggingRef.current = (v: boolean) => dragDrop.setIsDragging(v);

  const setDraggingJs = useCallback((v: boolean) => {
    setDraggingRef.current(v);
  }, []);

  useAnimatedReaction(
    () => draggableActiveId.value,
    (next) => {
      runOnJS(setDraggingJs)(next !== null);
    },
    [setDraggingJs],
  );

  const style = useMemo(
    () =>
      Object.assign(
        {
          flexDirection: direction,
          gap,
        },
        styleProp as object,
      ),
    [direction, gap, styleProp],
  );

  const horizontal = ["row", "row-reverse"].includes(
    (style as { flexDirection?: string }).flexDirection ?? direction,
  );

  const stackGap = (style as { gap?: number }).gap ?? gap;

  const panGesture = useMemo(() => {
    const findActiveLayoutId = (point: { x: number; y: number }) => {
      "worklet";
      const { x, y } = point;
      const layouts = draggableLayouts.value;
      const offsets = draggableOffsets.value;
      const options = draggableOptions.value;
      for (const [id, layout] of Object.entries(layouts)) {
        const offset = offsets[id];
        if (!offset) continue;
        const isDisabled = options[id]?.disabled;
        if (
          !isDisabled &&
          includesPoint(layout.value, {
            x: x - offset.x.value + draggableContentOffset.x.value,
            y: y - offset.y.value + draggableContentOffset.y.value,
          })
        ) {
          return id;
        }
      }
      return null;
    };

    const findDroppableLayoutId = (activeLayout: Layout) => {
      "worklet";
      const layouts = droppableLayouts.value;
      const options = droppableOptions.value;
      for (const [id, layout] of Object.entries(layouts)) {
        const isDisabled = options[id]?.disabled;
        if (!isDisabled && overlapsRectangle(activeLayout, layout.value)) {
          return id;
        }
      }
      return null;
    };

    let timeout: ReturnType<typeof setTimeout> | null = null;
    const clearActiveIdTimeout = () => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    };

    const setActiveId = (id: string, delay: number) => {
      timeout = setTimeout(() => {
        runOnUI(() => {
          "worklet";
          debug && console.log(`draggableActiveId.value = ${id}`);
          draggablePendingId.value = null;
          draggableActiveId.value = id;
          draggableStates.value[id]!.value = "dragging";
        })();
      }, delay);
    };

    const pan = Gesture.Pan()
      .activateAfterLongPress(rootActivationDelay > 0 ? rootActivationDelay : 200)
      .onBegin((event) => {
        const { state, x, y } = event;
        debug && console.log("begin", { state, x, y });
        if (disabled) return;

        panGestureState.value = state;
        const layouts = draggableLayouts.value;
        const offsets = draggableOffsets.value;
        const restingOffsets = draggableRestingOffsets.value;
        const options = draggableOptions.value;
        const states = draggableStates.value;
        const pendingId = draggablePendingId.value;

        runOnJS(clearActiveIdTimeout)();
        if (pendingId !== null) {
          if (states[pendingId]) {
            states[pendingId]!.value = "resting";
          }
          draggablePendingId.value = null;
        }

        const activeId = findActiveLayoutId({ x, y });
        if (activeId !== null) {
          const activeLayout = layouts[activeId]!.value;
          const activeOffset = offsets[activeId]!;
          const restingOffset = restingOffsets[activeId]!;
          const activeState = states[activeId]!.value;

          draggableInitialOffset.x.value = activeOffset.x.value;
          draggableInitialOffset.y.value = activeOffset.y.value;

          if (["dragging", "acting"].includes(activeState)) {
            cancelAnimation(activeOffset.x);
            cancelAnimation(activeOffset.y);
          } else {
            restingOffset.x.value = activeOffset.x.value;
            restingOffset.y.value = activeOffset.y.value;
          }

          const itemActivationDelay = options[activeId]?.activationDelay ?? 0;
          if (itemActivationDelay > 0) {
            draggablePendingId.value = activeId;
            draggableStates.value[activeId]!.value = "pending";
            runOnJS(setActiveId)(activeId, itemActivationDelay);
          } else {
            draggableActiveId.value = activeId;
            draggableActiveLayout.value = applyOffset(activeLayout, {
              x: activeOffset.x.value,
              y: activeOffset.y.value,
            });
            draggableStates.value[activeId]!.value = "dragging";
          }
        }
      })
      .onUpdate((event) => {
        const { state, translationX, translationY } = event;
        debug && console.log("update", { state, translationX, translationY });
        panGestureState.value = state;
        const activeId = draggableActiveId.value;
        const pendingId = draggablePendingId.value;
        const options = draggableOptions.value;
        const layouts = draggableLayouts.value;
        const offsets = draggableOffsets.value;

        if (activeId === null) {
          if (pendingId !== null) {
            const tol = options[pendingId]?.activationTolerance ?? Infinity;
            const distance = getDistance(translationX, translationY);
            if (distance > tol) {
              runOnJS(clearActiveIdTimeout)();
              if (draggableStates.value[pendingId]) {
                draggableStates.value[pendingId]!.value = "resting";
              }
              draggablePendingId.value = null;
            }
          }
          return;
        }

        const activeOffset = offsets[activeId]!;
        activeOffset.x.value = draggableInitialOffset.x.value + translationX;
        activeOffset.y.value = draggableInitialOffset.y.value + translationY;

        const activeLayout = layouts[activeId]!.value;
        draggableActiveLayout.value = applyOffset(activeLayout, {
          x: activeOffset.x.value,
          y: activeOffset.y.value,
        });
        droppableActiveId.value = findDroppableLayoutId(
          draggableActiveLayout.value,
        );
      })
      .onFinalize((event) => {
        const { state, velocityX, velocityY } = event;
        debug && console.log("finalize", { state, velocityX, velocityY });
        panGestureState.value = state;
        const activeId = draggableActiveId.value;
        const pendingId = draggablePendingId.value;
        const layouts = draggableLayouts.value;
        const offsets = draggableOffsets.value;
        const restingOffsets = draggableRestingOffsets.value;
        const states = draggableStates.value;

        if (activeId === null) {
          if (pendingId !== null) {
            runOnJS(clearActiveIdTimeout)();
            if (states[pendingId]) {
              states[pendingId]!.value = "resting";
            }
            draggablePendingId.value = null;
          }
          return;
        }

        runOnJS(clearActiveIdTimeout)();
        draggablePendingId.value = null;
        draggableActiveId.value = null;

        droppableActiveId.value = null;

        const activeOffset = offsets[activeId]!;
        const restingOffset = restingOffsets[activeId]!;
        states[activeId]!.value = "acting";
        const targetX = restingOffset.x.value;
        const targetY = restingOffset.y.value;
        animatePointWithSpring(
          activeOffset,
          [targetX, targetY],
          [
            { ...springConfig, velocity: velocityX },
            { ...springConfig, velocity: velocityY },
          ],
          ([finishedX, finishedY]) => {
            if (
              panGestureState.value !== State.END &&
              panGestureState.value !== State.FAILED &&
              states[activeId]!.value !== "acting"
            ) {
              return;
            }
            if (states[activeId]) {
              states[activeId]!.value = "resting";
            }
            if (!finishedX || !finishedY) {
              /* spring interrupted */
            }
          },
        );
      });

    if (rootActivationDelay > 0) {
      pan.activateAfterLongPress(rootActivationDelay);
    }
    if (minDistance > 0) {
      pan.minDistance(minDistance);
    }
    return pan;
  }, [disabled, debug, rootActivationDelay, minDistance, springConfig]);

  return (
    <SortableDndContext.Provider value={dndContextValue.current}>
      <SortableInstanceContext.Provider value={instanceCtx}>
        <GestureDetector gesture={panGesture}>
          <Animated.View
            ref={containerRef}
            collapsable={false}
            style={style}
          >
            <SortableInner
              ref={ref}
              gap={stackGap}
              horizontal={horizontal}
              childrenIds={childrenIds}
              onOrderChangeUser={onOrderChangeUser}
              onOrderUpdateUser={onOrderUpdateUser}
              shouldSwapWorklet={shouldSwapWorklet}
            >
              {children}
            </SortableInner>
          </Animated.View>
        </GestureDetector>
      </SortableInstanceContext.Provider>
    </SortableDndContext.Provider>
  );
});

// ---------------------------------------------------------------------------
// SortableItem (Draggable)
// ---------------------------------------------------------------------------

export type SortableItemProps = {
  id: string;
  children: React.ReactNode;
  data?: Record<string, unknown> | SharedValue<Record<string, unknown>>;
  disabled?: boolean;
  activationDelay?: number;
  activationTolerance?: number;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
  animatedStyleWorklet?: (
    base: Record<string, unknown>,
    state: {
      isActive: boolean;
      isActing: boolean;
      isDisabled: boolean;
    },
  ) => Record<string, unknown>;
};

export function SortableItem({
  children,
  id,
  data,
  disabled,
  style,
  activeOpacity = 0.9,
  activationDelay,
  activationTolerance,
  animatedStyleWorklet,
  ...otherProps
}: SortableItemProps) {
  const { offset, state, props, activeId: sessionActiveId } =
    useSortableDraggable({
      userId: id,
      data,
      disabled,
      activationDelay,
      activationTolerance,
    });

  const animatedStyle = useAnimatedStyle(() => {
    const isSleeping = state.value === "sleeping";
    const isActive = state.value === "dragging";
    const isActing = state.value === "acting";
    const zIndex = isActive ? 999 : isActing ? 998 : 1;
    // Spring only while a drag is in progress so siblings ease with placeholder moves.
    // After drop, sessionActiveId is null and refreshOffsets resets targets — raw values
    // avoid a second spring to the same visual position.
    const smoothResting =
      sessionActiveId.value !== null && state.value === "resting";
    const tx = smoothResting
      ? withSpring(offset.x.value, { damping: 100, stiffness: 1000 })
      : offset.x.value;
    const ty = smoothResting
      ? withSpring(offset.y.value, { damping: 100, stiffness: 1000 })
      : offset.y.value;
    const s: Record<string, unknown> = {
      opacity: isActive ? activeOpacity : 1,
      zIndex,
      transform: [{ translateX: tx }, { translateY: ty }],
    };
    if (animatedStyleWorklet) {
      Object.assign(
        s,
        animatedStyleWorklet(s, {
          isActive,
          isActing,
          isDisabled: !!disabled,
        }),
      );
    }
    return s as object;
  }, [id, state, activeOpacity, disabled, animatedStyleWorklet]);

  return (
    <Animated.View
      {...props}
      style={[style, animatedStyle]}
      {...otherProps}
    >
      {children}
    </Animated.View>
  );
}
