/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { ArrowClockwise, ArrowCounterClockwise } from 'phosphor-react';
import RectangleStackIcon from '@/icons/Xelah/RectangleStack.svg';
import ArrowDownOnSquareIcon from '@/icons/Xelah/ArrowDownOnSquare.svg';
import Bars2Icon from '@/icons/Xelah/Bars2.svg';
import Bars4Icon from '@/icons/Xelah/Bars4.svg';
import ArrowUturnLeftIcon from '@/icons/Xelah/ArrowUturnLeft.svg';
import ArrowUturnRightIcon from '@/icons/Xelah/ArrowUturnRight.svg';
import PencilIcon from '@/icons/Common/Pencil.svg';
import ArchiveBoxArrow from '@/icons/Xelah/ArchiveBoxArrow.svg';
import Alert from '@/icons/Xelah/Alert.svg';
import BarsArrowDown from '@/icons/Xelah/BarsArrowDown.svg';
import Close from '@/icons/Xelah/Close.svg';
import Info from '@/icons/Xelah/Info.svg';
import Refresh from '@/icons/Xelah/Refresh.svg';

export const classNames = (...classes) => classes.filter(Boolean).join(' ');

export default function Buttons(props) {
  const [sectionable, setSectionableState] = useState(false);
  const [blockable, setBlockableState] = useState(true);
  const [editable, setEditableState] = useState(true);
  const [preview, setPreviewState] = useState(false);
  const {
    bookCode,
    undo,
    redo,
    setSectionable,
    setBlockable,
    setEditable,
    setPreview,
    exportUsfm,
    setTriggerVerseInsert,
  } = props;

  const onSectionable = () => {
    setSectionableState(!sectionable);
    setSectionable(!sectionable);
  };
  const onBlockable = () => {
    setBlockableState(!blockable);
    setBlockable(!blockable);
  };
  const onEditable = () => {
    setEditableState(!editable);
    setEditable(!editable);
  };
  const onPreview = () => {
    setPreviewState(!preview);
    setPreview(!preview);
  };

  return (
    <>
      <RectangleStackIcon
        aria-label="Collection-Icon"
        className={classNames(
          sectionable ? 'fill-current' : '',
          'h-5 mr-2 w-5 text-white cursor-pointer',
        )}
        aria-hidden="true"
        onClick={onSectionable}
        title={
          sectionable ? 'Expand all Chapters' : 'Collapse Chapters'
        }
      />

      <PencilIcon
        aria-label="Pencil-Icon"
        className={classNames(
          editable ? 'fill-current' : '',
          'h-5 mr-2 w-5 text-white cursor-pointer',
        )}
        aria-hidden="true"
        onClick={onEditable}
        title={editable ? 'Disable Edit' : 'Enable Edit'}
      />
      {blockable ? (
        <Bars2Icon
          aria-label="Article-Icon"
          className="h-5 mr-2 w-5 text-white cursor-pointer"
          aria-hidden="true"
          onClick={onBlockable}
          title="Collapse blocks"
        />
      )
        : (
          <Bars4Icon
            aria-label="List-Icon"
            className="h-5 mr-2 w-5 text-white cursor-pointer"
            aria-hidden="true"
            onClick={onBlockable}
            title="Split into blocks"
          />
        )}

      <ArrowUturnLeftIcon
        aria-label="Undo-Icon"
        className="h-5 mr-2 w-5 text-white cursor-pointer"
        aria-hidden="true"
        onClick={() => undo()}
        title="Undo"
      />
      <ArrowUturnRightIcon
        aria-label="Redo-Icon"
        className="h-5 mr-2 w-5 text-white cursor-pointer"
        aria-hidden="true"
        onClick={() => redo()}
        title="Redo"
      />
      <ArrowDownOnSquareIcon
        aria-label="Save-Icon"
        className="h-5 mr-2 w-5 text-white cursor-pointer"
        aria-hidden="true"
        onClick={() => exportUsfm(bookCode)}
        title="Save"
      />
      <ArchiveBoxArrow
        aria-label="Archive-Icon"
        className="h-5 mr-2 w-5 text-white cursor-pointer"
        aria-hidden="true"
        title="Archive"
      />
      <Alert
        aria-label="Alert-Icon"
        className="h-5 mr-2 w-5 text-white cursor-pointer"
        aria-hidden="true"
        title="Alert"
      />
      <BarsArrowDown
        aria-label="BarsArrowDown-Icon"
        className="h-5 mr-2 w-5 text-white cursor-pointer"
        aria-hidden="true"
        title="BarsArrowDown"
      />
      <Refresh
        aria-label="Refresh-Icon"
        className="h-5 mr-2 w-5 text-white cursor-pointer"
        aria-hidden="true"
        title="Refresh"
      />
      <Info
        aria-label="Info-Icon"
        className="h-5 mr-2 w-5 text-white cursor-pointer"
        aria-hidden="true"
        title="Info"
      />
      <Close
        aria-label="Close-Icon"
        className="h-5 mr-2 w-5 text-white cursor-pointer"
        aria-hidden="true"
        title="Close"
      />
    </>
  );
}
