import { AppStateContext } from "@/services/states/AppStateMachine";
import AppService from "@/services/AppService";
import { useActor, useSelector } from "@xstate/vue";

export function useAppState() {
  return useActor(AppService.state);
}

export function useAppContext<T extends ContextProps<AppStateContext>>(prop: T) {
  return useSelector(
    AppService.state,
    (state) => state.context[prop],
    (prev, next) => prev === next
  );
}