import { ReactNode, createContext, useContext } from 'react';
import { useFxConverter } from '@/engines/useFxConverter';
import { useOverheadTracker } from '@/engines/useOverheadTracker';
import { useProfitCalculator } from '@/engines/useProfitCalculator';

type Toolkit = {
  profit: ReturnType<typeof useProfitCalculator>;
  fx: ReturnType<typeof useFxConverter>;
  overhead: ReturnType<typeof useOverheadTracker>;
};

const Ctx = createContext<Toolkit | null>(null);

// Hooks live above the router slot so inputs survive switching between tools.
export function ToolkitProvider({ children }: { children: ReactNode }) {
  const profit = useProfitCalculator();
  const fx = useFxConverter();
  const overhead = useOverheadTracker();
  return <Ctx.Provider value={{ profit, fx, overhead }}>{children}</Ctx.Provider>;
}

export function useToolkit(): Toolkit {
  const v = useContext(Ctx);
  if (!v) throw new Error('useToolkit must be used inside ToolkitProvider');
  return v;
}
