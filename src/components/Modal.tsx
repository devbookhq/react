import { Dialog, Transition } from '@headlessui/react'
import { Fragment, ReactNode } from 'react'

import Title from 'components/typography/Title'

interface Props {
  title: string
  children: ReactNode
  isOpen: boolean
  onClose: () => void
}

function Modal({ title, children, isOpen, onClose }: Props) {
  return (
    <Transition
      as={Fragment}
      show={isOpen}
      appear
    >
      <Dialog
        as="div"
        className="relative z-10"
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[#000]/50" />
        </Transition.Child>

        <div
          className="
          fixed
          inset-0
          flex
          justify-center
          overflow-y-auto
        "
        >
          <div
            className="
            relative
            top-[-100px]
            flex
            min-h-full
            max-w-[800px]
            flex-1
            items-center
            justify-center
            p-4
            text-center
          "
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className="
                flex
                w-full
                max-w-full
                transform
                flex-col
                items-start
                space-y-4
                rounded-lg
                border
                border-black-700
                bg-black-900/30
                p-6
                align-middle
                text-white-900
                shadow-xl
                backdrop-blur
                transition-all
              "
              >
                <div
                  className="
                  flex
                  items-center
                  justify-start
                "
                >
                  <Dialog.Title
                    as={Title}
                    size={Title.size.T1}
                    title={title}
                  />
                </div>
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default Modal