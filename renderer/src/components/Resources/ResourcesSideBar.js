import {
  DocumentTextIcon,
  PhotoIcon,
  ChatBubbleLeftEllipsisIcon,
  MicrophoneIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import ResourcesSideBarOption from './ResourcesSideBarOption';

export default function ResourcesSidebar({
  selectResource,
  setSelectResource,
  setShowInput,
  setTitle,
}) {
  const [isActive, setIsActive] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('');
  const { t } = useTranslation();

  const handleClick = (id) => {
    console.log('handle click');
    console.log(id);
    setSelectResource(id);
  };
  useEffect(() => {
    if (!selectResource) {
      setSelectResource('bible');
      setTitle('Bible');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const resourcesList = [
    {
      id: 'bible',
      title: t('label-resource-bible'),
      resourceType: 'referenceBible',
      Icon: BookOpenIcon,
      subCategory: [
        {
          id: 'tn',
          title: t('label-resource-tn'),
          resourceType: 'translationNote',
          Icon: DocumentTextIcon,
        },
        {
          id: 'twlm',
          title: t('label-resource-twl'),
          resourceType: 'translationWordList',
          Icon: PhotoIcon,
        },
        {
          id: 'tw',
          title: t('label-resource-twlm'),
          resourceType: 'translationWord',
          Icon: ChatBubbleLeftEllipsisIcon,
        },
        {
          id: 'tq',
          title: t('label-resource-tq'),
          resourceType: 'translationQuestion',
          Icon: BookOpenIcon,
        },
        {
          id: 'ta',
          title: t('label-resource-ta'),
          resourceType: 'translationAcademy',
          Icon: PhotoIcon,
        },
      ],
    },
    {
      id: 'obs',
      title: t('label-resource-obs'),
      resourceType: 'obsResource',
      Icon: ChatBubbleLeftEllipsisIcon,
      subCategory: [
        {
          id: 'obs-tn',
          title: t('label-resource-obs-tn'),
          resourceType: 'obsTranslationNote',
          Icon: DocumentTextIcon,
        },
        {
          id: 'obs-tq',
          title: t('label-resource-obs-tq'),
          resourceType: 'obsTranslationQuestion',
          Icon: QuestionMarkCircleIcon,
        },
      ],
    },
    {
      id: 'audio',
      title: t('label-audio-bible'),
      resourceType: 'audio',
      Icon: MicrophoneIcon,
      subCategory: [],
    },
  ];
  return (
    <div className="w-[30%] sm:w-[20%] bg-gray-100 h-[85vh] flex flex-col gap-4 p-2">
      {resourcesList.map((resource, idx) => {
        const { Icon, id, title } = resource;
        return (
          <div
            key={idx}
          >
            <ResourcesSideBarOption
              Icon={Icon}
              resource={resource}
              handleClick={handleClick}
              selectedMenu={selectedMenu}
              setSelectedMenu={setSelectedMenu}
              setShowInput={setShowInput}
            />
            <div className="pl-2">
              {resource.subCategory.length !== 0
              && resource.subCategory.map(
                (subCategory, categoryIdx) => {
                  const { Icon, id, title } = subCategory;
                  return (
                    <ResourcesSideBarOption
                      key={categoryIdx}
                      Icon={Icon}
                      resource={subCategory}
                      handleClick={handleClick}
                      selectedMenu={selectedMenu}
                      setSelectedMenu={
                          setSelectedMenu
                        }
                      setShowInput={setShowInput}
                    />
                  );
                },
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
