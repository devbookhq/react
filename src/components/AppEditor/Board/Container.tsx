import clsx from 'clsx'
import { observer } from 'mobx-react-lite'

import { getGridStyle, xStep, yStep } from 'core/EditorProvider/grid'
import { useRootStore } from 'core/EditorProvider/models/RootStoreProvider'

import { canvasClass, useBoard } from '../../../core/EditorProvider/useBoard'
import { UI, componentsSetup } from '../uiComponents'

const gridStyle = getGridStyle(xStep, yStep, '#94a3b8')

function Container() {
  const { ref } = useBoard(componentsSetup)
  const { board } = useRootStore()

  return (
    <div
      className={clsx('relative', 'bg-slate-50', 'flex', 'flex-1', canvasClass)}
      ref={ref}
      style={gridStyle}
      onClick={board.resetBlockSelection}
    >
      {board.boardBlocks.map(b => (
        <UI.EditorBoardBlock
          {...b}
          isSelected={b.id === board.selectedBlock?.id}
          key={b.id}
        />
      ))}
    </div>
  )
}

export default observer(Container)