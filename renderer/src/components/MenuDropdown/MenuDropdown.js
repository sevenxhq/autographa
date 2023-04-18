/* eslint-disable react/no-array-index-key */
import {
 Fragment, useEffect, useState,
} from 'react';
import { Dialog, Listbox, Transition } from '@headlessui/react';
import {
  CheckIcon,
  BookOpenIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/solid';
import localforage from 'localforage';
// import CheckIcon from '@/icons/Common/Check.svg';
// import ChevronUpDownIcon from '@/icons/Common/ChevronUpDown.svg';

// import { ReferenceContext } from '../context/ReferenceContext';
import * as logger from '../../logger';

export default function MenuDropdown({ selectedFont, setSelectedFont }) {
  // const {
  //   state: {
  //     selectedFont,
  //   },
  //   actions: {
  //     setSelectedFont,
  //   },
  // } = useContext(ReferenceContext);

  const [fonts, setFonts] = useState();

  async function getFonts() {
    logger.debug(
      'MenuDropdown.js',
      'In getFonts for fetching the list of font-family',
    );
    const fontFamily = await localforage.getItem('font-family');
    setFonts(fontFamily);
  }

  useEffect(() => {
    getFonts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [isOpen, setIsOpen] = useState(false);
  function handleFontClick(font) {
    setSelectedFont(font);
    setIsOpen(false);
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="cursor-pointer py-2 px-3 text-left bg-white rounded-lg shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-orange-300 focus-visible:ring-offset-2 focus-visible:border-indigo-500 sm:text-sm"
      >
        <BookOpenIcon
          className="w-5 h-5 text-gray-500"
          aria-hidden="true"
        />
      </button>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-20"
          onClose={() => setIsOpen(false)}
          returnFocus
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
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full min-h-32 max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
                    Font Selector
                  </Dialog.Title>
                  <Listbox
                    className="w-full"
                    value={selectedFont}
                    onChange={(font) => handleFontClick(font)}
                  >
                    <div className="relative w-full mt-1">
                      <Listbox.Button
                        aria-label="selected-font"
                        className="relative w-full py-2 pl-3 pr-10 text-left bg-white rounded-lg shadow-md cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-orange-300 focus-visible:ring-offset-2 focus-visible:border-indigo-500 sm:text-sm"
                      >
                        <span className="block truncate">
                          {selectedFont
                            || 'Select Font'}
                        </span>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <ChevronUpDownIcon
                            className="w-5 h-5 text-gray-400"
                            aria-hidden="true"
                          />
                        </span>
                      </Listbox.Button>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {fonts
                            && fonts.map(
                              (
                                font,
                                personIdx,
                              ) => (
                                <Listbox.Option
                                  key={
                                    personIdx
                                  }
                                  className={({
                                    active,
                                  }) => `${active
                                      ? 'text-amber-900 bg-amber-100'
                                      : 'text-gray-900'
                                    }
                          cursor-default select-none relative py-2 pl-5 pr-4`}
                                  value={font}
                                  aria-label={
                                    font
                                  }
                                >
                                  {({
                                    selectedFont,
                                    active,
                                  }) => (
                                    <>
                                      <span
                                        className={`${selectedFont
                                            ? 'font-medium'
                                            : 'font-normal'
                                          } block truncate`}
                                      >
                                        {
                                          font
                                        }
                                      </span>
                                      {selectedFont ? (
                                        <span
                                          className={`${active
                                              ? 'text-amber-600'
                                              : 'text-amber-600'
                                            }
                                absolute inset-y-0 left-0 flex items-center pl-3`}
                                        >
                                          <CheckIcon
                                            className="w-5 h-5"
                                            aria-hidden="true"
                                          />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                              ),
                            )}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
