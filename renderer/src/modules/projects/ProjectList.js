/* eslint-disable no-nested-ternary */

'use client';

/* eslint-disable react/jsx-no-useless-fragment */
import React, { Fragment, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import moment from 'moment';

import { Disclosure, Transition, Menu } from '@headlessui/react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import {
  StarIcon, EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import localforage from 'localforage';

import { useTranslation } from 'react-i18next';
import ProjectsLayout from '@/layouts/projects/Layout';
import EnhancedTableHead from '@/components/ProjectsPage/Projects/EnhancedTableHead';
import AutographaContextProvider, { AutographaContext } from '@/components/context/AutographaContext';

import ExportProjectPopUp from '@/layouts/projects/Export/ExportProjectPopUp';
import ProjectContextProvider from '@/components/context/ProjectContext';
import JSZip from 'jszip';
import LoadingScreen from '@/components/Loading/LoadingScreen';
import SearchTags from './SearchTags';
import NewProject from './NewProject';
import * as logger from '../../logger';
import { supabaseStorage } from '../../../../supabase';

export default function ProjectList() {
  const router = useRouter();
  const { t } = useTranslation();
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [showArchived, setShowArchived] = useState(false);
  const [projects, setProjects] = useState();

  const filterList = ['name', 'language', 'type', 'date', 'view'];
  const {
    states: {
      // starredrow,
      // unstarredrow,
      // starredProjects,
      // unstarredProjects,
      loading,
      activeNotificationCount,
    },
    action: {
      setStarredRow,
      setUnStarredRow,
      handleClickStarred,
      // archiveProject,
      setSelectedProject,
      setLoading,
      setNotifications,
      setActiveNotificationCount,
      FetchProjects,
    },
  } = React.useContext(AutographaContext);
  const [callEditProject, setCallEditProject] = useState(false);
  const [openPopUp, setOpenPopUp] = useState(false);
  const [currentProject, setCurrentProject] = useState();

  const openExportPopUp = async (project) => {
    console.log('Exporting project...');
    setLoading(true);
    setCurrentProject(project);
    // setOpenPopUp(true);
    const name = project.identification?.name?.en ?? '';
    const id = Object.keys(project.identification?.primary?.ag ?? {})[0] ?? '';
    const projectName = `${name}_${id}`;
    const folderPath = `autographa/users/samuel/projects/${projectName}/ingredients`;
    const { data: files, error } = await supabaseStorage().list(folderPath);

    if (error) {
      console.error('Error fetching ingredient files', error);
    }

    const zip = new JSZip(); // Create a new JSZip instance
    for (const file of files) {
      const { data, error } = await supabaseStorage()
        .download(`${folderPath}/${file.name}`);

      const { data: metadata } = await supabaseStorage()
        .download(`autographa/users/samuel/projects/${projectName}/metadata.json`);

      const arrayBuffer = await data.arrayBuffer(); // Convert Blob to ArrayBuffer
      const content = new TextDecoder('utf-8').decode(arrayBuffer);
      // Add the file to the ZIP archive inside an 'ingredients' folder
      zip.folder('ingredients').file(file.name, content);
      zip.file('metadata.json', metadata);
      if (error) {
        console.error('Zip error occurred', error);
        return;
      }
    }

    // Generate the ZIP archive and trigger a download of the file
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${projectName.replace('/', '-')}_ingredients.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setLoading(false);
  };

  const closeExportPopUp = () => {
    setOpenPopUp(false);
  };
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectProject = (event, projectName, projectId) => {
    setLoading(true);
    logger.debug('ProjectList.js', 'In handleSelectProject');
    setSelectedProject(projectName);
    localforage.setItem('currentProject', `${projectName}_${projectId}`);
    router.push('/home');
    localforage.getItem('notification').then((value) => {
      const temp = [...value];
      temp.push({
        title: 'Project',
        text: `successfully loaded ${projectName} files`,
        type: 'success',
        time: moment().format(),
        hidden: true,
      });
      setNotifications(temp);
    }).then(() => setActiveNotificationCount(activeNotificationCount + 1));
    console.log({ projectName, projectId });
    // setLoading(false);
  };

  const editproject = async (project) => {
    logger.debug('ProjectList.js', 'In editproject');
    const path = require('path');
    const fs = window.require('fs');
    const newpath = localStorage.getItem('userPath');
    await localforage.getItem('userProfile').then((value) => {
      const folder = path.join(newpath, 'autographa', 'users', value.username, 'projects', `${project.name}_${project.id[0]}`);
      const data = fs.readFileSync(path.join(folder, 'metadata.json'), 'utf-8');
      let metadata = JSON.parse(data);
      const firstKey = Object.keys(metadata.ingredients)[0];
      const folderName = firstKey.split(/[(\\)?(/)?]/gm).slice(0, -1);
      let dirName = '';
      folderName.forEach((folder) => {
        dirName = path.join(dirName, folder);
      });
      const settings = fs.readFileSync(path.join(folder, dirName, 'ag-settings.json'), 'utf-8');
      const agSetting = JSON.parse(settings);
      metadata = { ...metadata, ...agSetting };
      logger.debug('ProjectList.js', 'Loading current project metadata');
      setCurrentProject(metadata);
      setCallEditProject(true);
    });
  };

  const closeEditProject = async () => {
    logger.debug('ProjectList.js', 'Closing edit project page and updating the values');
    setCallEditProject(false);
    await FetchProjects();
  };

  function filterArchive(project) {
    if (project.isArchived === showArchived || (project.isArchived === undefined && showArchived === false)) {
      return true;
    }
    return false;
  }

  const getProjects = async () => {
    const path = 'autographa/users/samuel/projects';
    const { data: allProjects } = await supabaseStorage().list(path);
    const projectPromises = allProjects.map(async (proj) => {
      const projectName = proj.name;
      const { data, error } = await supabaseStorage()
        .download(`${path}/${projectName}/metadata.json`);
      if (error) {
        logger.error('ProjectList.js', 'Failed to fetch projects from Supabase');
        return null;
      }
      const projectJson = JSON.parse(await data.text());
      return projectJson;
    });

    Promise.all(projectPromises).then((projectsArray) => {
      const filteredProjects = projectsArray.filter((p) => p !== null);
      setProjects(filteredProjects);
      localforage.setItem('projectmeta', { projects: filteredProjects });
    });
  };

  const archiveProj = async (project) => {
    const name = project.identification?.name?.en ?? '';
    const id = Object.keys(project.identification?.primary?.ag ?? {})[0] ?? '';
    const projectName = `${name}_${id}`;
    const path = `autographa/users/samuel/projects/${projectName}/metadata.json`;

    // Download the existing metadata JSON from Supabase storage
    const { data, error } = await supabaseStorage().download(path);
    if (error) {
      logger.error('Failed to download project metadata:', error.message);
      return;
    }

    // Parse the metadata JSON as an object
    const metadata = JSON.parse(await data.text());

    // Update the metadata object by adding or flipping the isArchived field
    if (metadata.isArchived === undefined) {
      metadata.isArchived = true;
    } else {
      metadata.isArchived = !metadata.isArchived;
    }

    // Convert the updated metadata object to a JSON string
    const updatedMetadata = JSON.stringify(metadata);

    // Upload the updated metadata JSON back to Supabase storage
    const { data: archivefile, error: uploadError } = await supabaseStorage().update(path, updatedMetadata, {
      cacheControl: '3600',
      upsert: true,
    });
    if (uploadError) {
      console.error('Failed to upload updated project metadata:', uploadError.message);
      return;
    }
    console.log('archived!', archivefile);
    await getProjects();
  };

  useEffect(() => {
    getProjects();
  }, []);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredData = projects?.filter((object) => {
    const name = object.identification.name;
    if (name && name.en) {
      return name.en.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return false;
  });

  return (
    <>
      {loading ? <LoadingScreen /> : callEditProject === false
        ? (
          <>
            <ProjectsLayout
              title={t('projects-page')}
              isImport
              showArchived={showArchived}
              setShowArchived={setShowArchived}
              header={(
                <SearchTags
                  contentList1={projects}
                  contentList2={projects}
                  filterList={filterList}
                  onfilerRequest1={setStarredRow}
                  onfilerRequest2={setUnStarredRow}
                  onSearch={handleSearch}
                />
              )}
            >
              <div className="mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-4 sm:px-0">

                  <div className="flex flex-col">
                    <div className="-my-2 sm:-mx-6 lg:-mx-8">
                      <div className="align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow border-b border-gray-200 sm:rounded-lg">
                          <table data-testid="tablelayout" className="min-w-full divide-y divide-gray-200 mb-9">
                            <EnhancedTableHead
                              order={order}
                              orderBy={orderBy}
                              onRequestSort={handleRequestSort}
                            />
                            <tbody className="bg-white divide-y divide-gray-200">
                              {projects && filteredData.filter(filterArchive).map((project) => (
                                <Disclosure key={project?.identification?.name?.en}>
                                  {({ open }) => (
                                    <>
                                      <tr className="hover:bg-gray-100 focus:outline-none cursor-pointer">
                                        <td
                                          className="px-4 py-4"
                                        >
                                          <button
                                            title="unstar project"
                                            aria-label="unstar-project"
                                            onClick={(event) => handleClickStarred(event, project.identification.name.en, 'unstarred')}
                                            type="button"
                                          >
                                            <StarIcon className="h-5 w-5" aria-hidden="true" />
                                          </button>
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="flex items-center">
                                            <div className="ml-0">
                                              <div
                                                onClick={
                                                  (event) => handleSelectProject(event, project.identification.name.en, Object?.keys(project?.identification?.primary?.ag)[0])
                                                }
                                                role="button"
                                                aria-label="unstar-project-name"
                                                tabIndex="0"
                                                className="text-sm font-medium text-gray-900"
                                              >
                                                {project.identification.name.en}
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="text-sm text-gray-900">{project?.languages?.[0]?.name?.en}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="text-sm text-gray-900">{project?.type?.flavorType?.flavor?.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{moment(project?.meta?.dateCreated).format('LL')}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{moment(project?.meta?.dateCreated, 'YYYY-MM-DD h:mm:ss').fromNow()}</td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                          <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-purple-900 bg-purple-100 rounded-lg hover:bg-purple-200 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75">
                                            {open
                                              ? <ChevronUpIcon className="w-5 h-5 text-purple-500" />
                                              : <ChevronDownIcon aria-label="unstar-expand-project" className="w-5 h-5 text-purple-500" />}
                                          </Disclosure.Button>
                                        </td>
                                      </tr>
                                      <Transition
                                        as={Fragment}
                                        enter="transition duration-100 ease-out"
                                        enterFrom="transform scale-95 opacity-0"
                                        enterTo="transform scale-100 opacity-100"
                                        leave="transition duration-75 ease-out"
                                        leaveFrom="transform scale-100 opacity-100"
                                        leaveTo="transform scale-95 opacity-0"
                                      >
                                        <Disclosure.Panel as="tr" key={project?.identification?.name?.en}>
                                          <td />
                                          <td className="px-6 py-4">
                                            <div className="text-xxs uppercase font-regular text-gray-500 tracking-wider p-1">description</div>
                                            <div aria-label="project-description-display" className="text-sm tracking-wide p-1">Description</div>
                                          </td>
                                          <td colSpan="3" className="px-5">
                                            <div className="text-xxs uppercase font-regular text-gray-500 tracking-wider p-1">Project ID</div>
                                            <div className="text-sm tracking-wide p-1">{Object.keys(project?.identification?.primary?.ag)[0]}</div>
                                          </td>
                                          <td className="pl-5">
                                            <Menu as="div">
                                              <div>
                                                <Menu.Button className="px-5">
                                                  <EllipsisVerticalIcon className="h-5 w-5 text-primary" aria-label="unstar-menu-project" aria-hidden="true" />
                                                </Menu.Button>
                                              </div>
                                              <Transition
                                                as={Fragment}
                                                enter="transition ease-out duration-100"
                                                enterFrom="transform opacity-0 scale-95"
                                                enterTo="transform opacity-100 scale-100"
                                                leave="transition ease-in duration-75"
                                                leaveFrom="transform opacity-100 scale-100"
                                                leaveTo="transform opacity-0 scale-95"
                                              >
                                                <Menu.Items className="fixed right-26 top-4 w-56 mb-1 z-50 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                  <div className="px-1 py-1">
                                                    <Menu.Item>
                                                      {({ active }) => (
                                                        <button
                                                          type="button"
                                                          aria-label="edit-project"
                                                          className={`${active ? 'bg-primary text-white' : 'text-gray-900'
                                                            } group rounded-md items-center w-full px-2 py-2 text-sm ${project.isArchived ? 'hidden' : 'flex'}`}
                                                          onClick={() => editproject(project)}
                                                        >
                                                          {t('btn-edit')}
                                                        </button>
                                                      )}
                                                    </Menu.Item>
                                                    <Menu.Item>
                                                      {({ active }) => (
                                                        <button
                                                          type="button"
                                                          className={`${active ? 'bg-primary text-white' : 'text-gray-900'
                                                            } group rounded-md items-center w-full px-2 py-2 text-sm ${project.isArchived ? 'hidden' : 'flex'}`}
                                                          onClick={() => openExportPopUp(project)}
                                                        >
                                                          {t('btn-export')}
                                                        </button>
                                                      )}
                                                    </Menu.Item>
                                                    <Menu.Item>
                                                      {({ active }) => (
                                                        <button
                                                          type="button"
                                                          className={`${active ? 'bg-primary text-white' : 'text-gray-900'
                                                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                                          onClick={() => {
                                                            archiveProj(project);
                                                          }}
                                                        >
                                                          {project.isArchived ? 'Restore' : 'Archive'}
                                                        </button>
                                                      )}
                                                    </Menu.Item>
                                                  </div>
                                                </Menu.Items>
                                              </Transition>
                                            </Menu>

                                          </td>
                                        </Disclosure.Panel>

                                      </Transition>
                                    </>
                                  )}
                                </Disclosure>
                              ))}
                            </tbody>
                            {/* <tbody className="bg-white divide-y divide-gray-200">
                              {projects && (
                                <Disclosure key={projects?.identification?.name?.en}>
                                  {({ open }) => (
                                    <>
                                      <tr className="hover:bg-gray-100 focus:outline-none cursor-pointer">
                                        <td
                                          className="px-4 py-4"
                                        >
                                          <button
                                            title="unstar project"
                                            aria-label="unstar-project"
                                            onClick={(event) => handleClickStarred(event, projects.identification.name.en, 'unstarred')}
                                            type="button"
                                          >
                                            <StarIcon className="h-5 w-5" aria-hidden="true" />
                                          </button>
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="flex items-center">
                                            <div className="ml-0">
                                              <div
                                                onClick={
                                                  (event) => handleSelectProject(event, projects.identification.name.en, '727b08fc-71bf-5f67-88d0-c21fcd89f06c')
                                                }
                                                role="button"
                                                aria-label="unstar-project-name"
                                                tabIndex="0"
                                                className="text-sm font-medium text-gray-900"
                                              >
                                                Archive Project

                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="text-sm text-gray-900">{projects?.languages?.[0]?.name?.en}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                          <div className="text-sm text-gray-900">{projects?.type?.flavorType?.flavor?.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{moment(projects?.meta?.dateCreated).format('LL')}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{moment(projects?.meta?.dateCreated, 'YYYY-MM-DD h:mm:ss').fromNow()}</td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                          <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-purple-900 bg-purple-100 rounded-lg hover:bg-purple-200 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75">
                                            {open
                                              ? <ChevronUpIcon className="w-5 h-5 text-purple-500" />
                                              : <ChevronDownIcon aria-label="unstar-expand-project" className="w-5 h-5 text-purple-500" />}
                                          </Disclosure.Button>
                                        </td>
                                      </tr>
                                      <Transition
                                        as={Fragment}
                                        enter="transition duration-100 ease-out"
                                        enterFrom="transform scale-95 opacity-0"
                                        enterTo="transform scale-100 opacity-100"
                                        leave="transition duration-75 ease-out"
                                        leaveFrom="transform scale-100 opacity-100"
                                        leaveTo="transform scale-95 opacity-0"
                                      >
                                        <Disclosure.Panel as="tr" key={projects?.identification?.name?.en}>
                                          <td />
                                          <td className="px-6 py-4">
                                            <div className="text-xxs uppercase font-regular text-gray-500 tracking-wider p-1">description</div>
                                            <div aria-label="project-description-display" className="text-sm tracking-wide p-1">Description</div>
                                          </td>
                                          <td colSpan="3" className="px-5">
                                            <div className="text-xxs uppercase font-regular text-gray-500 tracking-wider p-1">Project ID</div>
                                            <div className="text-sm tracking-wide p-1">{Object.keys(projects?.identification?.primary?.ag)[0]}</div>
                                          </td>
                                          <td className="pl-5">
                                            <Menu as="div">
                                              <div>
                                                <Menu.Button className="px-5">
                                                  <EllipsisVerticalIcon className="h-5 w-5 text-primary" aria-label="unstar-menu-project" aria-hidden="true" />
                                                </Menu.Button>
                                              </div>
                                              <Transition
                                                as={Fragment}
                                                enter="transition ease-out duration-100"
                                                enterFrom="transform opacity-0 scale-95"
                                                enterTo="transform opacity-100 scale-100"
                                                leave="transition ease-in duration-75"
                                                leaveFrom="transform opacity-100 scale-100"
                                                leaveTo="transform opacity-0 scale-95"
                                              >
                                                <Menu.Items className="fixed right-26 top-4 w-56 mb-1 z-50 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                  <div className="px-1 py-1">
                                                    <Menu.Item>
                                                      {({ active }) => (
                                                        <button
                                                          type="button"
                                                          aria-label="edit-project"
                                                          className={`${active ? 'bg-primary text-white' : 'text-gray-900'
                                                            } group rounded-md items-center w-full px-2 py-2 text-sm ${projects.isArchived ? 'hidden' : 'flex'}`}
                                                          onClick={() => editproject(projects)}
                                                        >
                                                          {t('btn-edit')}
                                                        </button>
                                                      )}
                                                    </Menu.Item>
                                                    <Menu.Item>
                                                      {({ active }) => (
                                                        <button
                                                          type="button"
                                                          className={`${active ? 'bg-primary text-white' : 'text-gray-900'
                                                            } group rounded-md items-center w-full px-2 py-2 text-sm ${projects.isArchived ? 'hidden' : 'flex'}`}
                                                          onClick={() => openExportPopUp(projects)}
                                                        >
                                                          {t('btn-export')}
                                                        </button>
                                                      )}
                                                    </Menu.Item>
                                                    <Menu.Item>
                                                      {({ active }) => (
                                                        <button
                                                          type="button"
                                                          className={`${active ? 'bg-primary text-white' : 'text-gray-900'
                                                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                                          onClick={() => {
                                                            archiveProject(projects, projects?.identification?.name?.en);
                                                          }}
                                                        >
                                                          Archive
                                                        </button>
                                                      )}
                                                    </Menu.Item>
                                                  </div>
                                                </Menu.Items>
                                              </Transition>
                                            </Menu>

                                          </td>
                                        </Disclosure.Panel>

                                      </Transition>
                                    </>
                                  )}
                                </Disclosure>
                              )}
                            </tbody> */}
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </ProjectsLayout>
            <ExportProjectPopUp open={openPopUp} closePopUp={closeExportPopUp} project={currentProject} />
          </>
        )
        : <ProjectContextProvider><AutographaContextProvider><NewProject call="edit" project={currentProject} closeEdit={() => closeEditProject()} /></AutographaContextProvider></ProjectContextProvider>}
    </>
  );
}
