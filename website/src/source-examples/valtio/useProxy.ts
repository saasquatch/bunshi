import { Proxy, snapshot, subscribe } from "valtio/vanilla";
import { getCurrentInstance, onScopeDispose, readonly, shallowRef } from "vue";

export function useProxy<Value>(proxy: Proxy<Value>) {
  /**
   * Prefer `shallowRef` over `ref` for external state
   * - https://vuejs.org/api/reactivity-advanced.html#shallowref
   */
  const refValue = shallowRef(snapshot(proxy));

  const unsub = subscribe(proxy, () => {
    refValue.value = snapshot(proxy) as any;
  });

  if (getCurrentInstance()) {
    onScopeDispose(() => {
      unsub();
    });
  }

  return readonly(refValue);
}
