/* eslint-disable react/jsx-key */
/* eslint-disable no-nested-ternary */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import localForage from 'localforage';
import { useTranslation } from 'react-i18next';
import { SnackBar } from '@/components/SnackBar';
import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import LoadingScreen from '@/components/Loading/LoadingScreen';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { AutographaContext } from '@/components/context/AutographaContext';
import CustomMultiComboBox from './CustomMultiComboBox';
import langJson from '../../../lib/lang/langNames.json';
import { handleDownloadResources } from './createDownloadedResourceSB';
import * as logger from '../../../logger';

const subjectTypeArray = {
  bible: [
    { id: 2, name: 'Bible' },
    // { id: 1, name: 'Aligned Bible' },
    // { id: 3, name: 'Hebrew Old Testament' },
    // { id: 4, name: 'Greek New Testament' },
  ],
  obs: [
    { id: 1, name: 'Open Bible Stories' },
  ],
};

// mui styles for accordion
const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: '#fff',
    color: '#000',
    boxShadow: '0px 0px 15px 1px rgba(0,0,0,0.43);',

  },
  summary: {
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: theme.typography.pxToRem(12),
    fontWeight: '500',
    color: '#000',
  },
}));

function DownloadResourcePopUp({ selectResource, isOpenDonwloadPopUp, setIsOpenDonwloadPopUp }) {
  logger.debug('DownloadResourcePopUp.js', 'in download resource pop up');
  const { t } = useTranslation();
  const [snackBar, setOpenSnackBar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadFilterDiv, setLoadFilterDiv] = useState(false);
  const [snackText, setSnackText] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [notify, setNotify] = useState();
  const [resourceData, setresourceData] = useState([]);
  const [selectedLangFilter, setSelectedLangFilter] = useState([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState([]);
  const [selectedPreProd, setSelectedPreProd] = useState(false);
  // resource Download
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [totalDownload, setTotalDownload] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [downloadCount, setDownloadCount] = useState(0);
  const [expandAccordion, setExpandAccordion] = useState('');

  const {
    // states: { resourceDownload },
    action: {
      setNotifications,
      // setResourceDownload,
    },
  } = React.useContext(AutographaContext);

  const modalClose = () => {
    if (!downloadStarted) {
      setIsOpenDonwloadPopUp(false);
    }
  };

  const toggleAcordion = (element) => {
    if (expandAccordion === element) { setExpandAccordion(''); }
    if (expandAccordion !== element) { setExpandAccordion(element); }
  };

  const addNewNotification = async (title, text, type) => {
    localForage.getItem('notification').then((value) => {
      const temp = [...value];
      temp.push({
        title,
        text,
        type,
        time: moment().format(),
        hidden: true,
      });
      setNotifications(temp);
    });
  };

  const fetchResource = async (filter) => {
    logger.debug('DownloadResourcePopUp.js', 'fetching resource as per filter applied');
    setLoading(true);
    // subject = bible and lang = en - if not custom filter or initial loading
    const baseUrl = 'https://git.door43.org/api/catalog/v5/search';
    let url = '';
    if (filter) {
      url = `${baseUrl}?`;
      if (selectedLangFilter.length > 0) {
        selectedLangFilter.forEach((row) => {
          if (url.slice(-1) === '?') {
            url += `lang=${row?.lc ? row?.lc : row?.code}`;
          } else {
            url += `&lang=${row?.lc ? row?.lc : row?.code}`;
          }
        });
      }
      if (selectedTypeFilter.length > 0) {
        selectedTypeFilter.forEach((row) => {
          if (url.slice(-1) === '?') {
            url += `subject=${row.name}`;
          } else {
            url += `&subject=${row.name}`;
          }
        });
      } else {
        // nothing selected default will be bible || obs
        switch (selectResource) {
          case 'bible':
            url += '&subject=Bible';
            break;
          case 'obs':
            url += `&subject=${subjectTypeArray.obs[0].name}`;
            break;
          default:
            break;
        }
      }
    } else {
      // initial load
      switch (selectResource) {
        case 'bible':
          url = `${baseUrl}?subject=Bible&lang=en`;
          break;
        case 'obs':
          url = `${baseUrl}?subject=${subjectTypeArray.obs[0].name}&lang=en`;
          break;
        default:
          break;
      }
      // url = `${baseUrl}?subject=Bible&subject=Aligned Bible&lang=en&lang=ml`;
    }
    // pre-release items
    if (selectedPreProd) {
      url += '&stage=preprod';
    }
    // url = 'https://git.door43.org/api/catalog/v5/search?subject=Aligned%20Bible&subject=Bible&lang=en&lang=ml&lang=hi';
    const temp_resource = {};
    selectedLangFilter.forEach((langObj) => {
      temp_resource[langObj.lc] = [];
    });
    const fetchedData = await fetch(url);
    const fetchedDataJson = await fetchedData.json();
    logger.debug('DownloadResourcePopUp.js', 'generating language based resources after fetch');
    try {
      fetchedDataJson.data.forEach((element) => {
        element.isChecked = false;
        if (element.language in temp_resource) {
          temp_resource[element.language].push(element);
        } else {
          temp_resource[element.language] = [element];
        }
      });
      setresourceData(temp_resource);
      setLoading(false);
    } catch (err) {
      logger.debug('DownloadResourcePopUp.js', 'Error on fetch content : ', err);
      setLoading(false);
      setOpenSnackBar(true);
      setNotify('failure');
      setSnackText(`${err.message || err} , Error might be due to Internet`);
    }
  };

  const handleCheckbox = (e, obj) => {
    logger.debug('DownloadResourcePopUp.js', 'In check box resource selection');
    const temp_resource = resourceData;
    if (obj.selection === 'full') {
      // eslint-disable-next-line array-callback-return
      temp_resource[obj.id].map((row) => {
        row.isChecked = e.target.checked;
      });
    } else if (obj.selection === 'single') {
      // eslint-disable-next-line array-callback-return
      temp_resource[obj.parent].filter((row) => {
        if (row.id === obj.id) {
          row.isChecked = e.target.checked;
        }
      });
    }
    setresourceData((current) => ({
      ...current,
      ...temp_resource,
    }));
  };

  const handleClearFilter = () => {
    logger.debug('DownloadResourcePopUp.js', 'In clear filter');
    setSelectedLangFilter([]);
    setSelectedTypeFilter([]);
    setSelectedPreProd(false);
  };

  const handleSaveFilter = async () => {
    logger.debug('DownloadResourcePopUp.js', 'save filter and call fetch');
    if (!downloadStarted) {
      setLoadFilterDiv(!loadFilterDiv);
      if (selectedLangFilter.length > 0 || selectedTypeFilter.length > 0) {
        await fetchResource(true);
      } else {
        setOpenSnackBar(true);
        setNotify('warning');
        setSnackText('No filter applied, please select filter');
      }
    } else {
      setOpenSnackBar(true);
      setNotify('warning');
      setSnackText('Please Wait, Download in progrss');
    }
  };

  const handleRemoveAccordion = (langCode) => {
    const resourceDataFiltered = [];
    // eslint-disable-next-line array-callback-return
    Object.keys(resourceData).filter((element) => {
      if (element.toLowerCase() !== langCode.toLowerCase()) {
        resourceDataFiltered[element] = resourceData[element];
      }
    });
    setresourceData(resourceDataFiltered);
  };
  const handleDownload = async () => {
    logger.debug('DownloadResourcePopUp.js', 'in handle download - call for download selected');
    // check total count to download
    const selectedResourceCount = Object.keys(resourceData).reduce((acc, key) => {
      const checkedData = resourceData[key].filter((data) => data.isChecked);
      return acc + checkedData.length;
    }, 0);
    try {
      if (selectedResourceCount > 0) {
        if (downloadStarted) {
          // console.log('downlaod in progress');
          throw new Error('Download in progress, please wait');
        }
        setTotalDownload(selectedResourceCount);
        logger.debug('DownloadResourcePopUp.js', 'In resource download all resource loop');
        // console.log('resource download started ---', selectedResourceCount);
        setDownloadStarted(true);
        const action = { setDownloadCount };
        await handleDownloadResources(resourceData, selectResource, action)
          .then(async (resolveResp) => {
            if (selectedResourceCount === resolveResp?.existing) {
              setOpenSnackBar(true);
              setNotify('Warning');
              setSnackText('Existing Resource');
            } else if (resolveResp?.existing === 0) {
              setOpenSnackBar(true);
              setNotify('success');
              setSnackText(`All ${selectedResourceCount} Resource Downloaded Succesfully`);
            } else {
              setOpenSnackBar(true);
              setNotify('success');
              setSnackText(`Downloaded ${selectedResourceCount - resolveResp.existing} Resource Downloaded Succesfully
          , ${resolveResp.existing} Resources are existing`);
            }
            await addNewNotification(
              'Resource Download',
              `Total Resources : ${selectedResourceCount} \n
            Existing Resources : ${resolveResp.existing} \n
            Downloaded Resources : ${selectedResourceCount - resolveResp.existing} `,
              'success',
            );
            // setDownloadCount((prev) => prev + 1);
          }).catch((err) => {
            throw new Error(`Resource download Failed :  ${err}`);
          });
        // console.log('DOWNLOAD FINISHED');
        setDownloadStarted(false);
        setTotalDownload(0);
        setDownloadCount(0);
        logger.debug('DownloadResourcePopUp.js', 'Completed Download all resource selected');
      } else {
        logger.debug('DownloadResourcePopUp.js', 'No resource selected to download - warning');
        setOpenSnackBar(true);
        setNotify('warning');
        setSnackText('please select Resource to Download');
        // console.log('please select Resource to Download');
      }
    } catch (err) {
      setOpenSnackBar(true);
      setNotify('failure');
      setSnackText(`Error : ${err?.message || err}`);
    }
  };

  useEffect(() => {
    console.log('sadfasdfasdfasdf');
    logger.debug('DownloadResourcePopUp.js', 'in useEffect initial load of resource');
    fetchResource(false);
    // setLoading(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const classes = useStyles();

  return (
    <>
      <div className="text-sm flex flex-col gap-4 border-b border-gray-300 pb-4 mb-4">
        <div class="flex items-center gap-4">
          <label htmlFor="filter-lang" className="font-bold w-24">Language</label>
          <CustomMultiComboBox
            selectedList={selectedLangFilter}
            setSelectedList={setSelectedLangFilter}
            customData={langJson}
            filterParams="ang"
          />
        </div>

        <div class="flex items-center gap-4">
          <label htmlFor="filter-type" className="font-bold w-24">Type</label>
          <CustomMultiComboBox
            selectedList={selectedTypeFilter}
            setSelectedList={setSelectedTypeFilter}
            customData={selectResource === 'bible' ? subjectTypeArray.bible : subjectTypeArray.obs}
          />
        </div>

        <div class="flex items-center gap-4">
          <label htmlFor="pre-prod" className="font-bold w-24">Prerelease</label>
          <input
            id="pre-prod"
            name="pre-prod"
            type="checkbox"
            checked={selectedPreProd}
            onChange={(e) => setSelectedPreProd(e.target.checked)}
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="bg-error leading-loose rounded shadow text-xs px-2 font-base text-white tracking-wide uppercase"
            onClick={handleClearFilter}
          >
            {t('btn-clear')}
          </button>
          <button
            type="button"
            className="bg-success leading-loose rounded shadow text-xs px-2 font-base text-white tracking-wide uppercase"
            onClick={handleSaveFilter}
          >
            Save Filter
          </button>
        </div>
      </div>

      {loading ? <LoadingScreen />
          : downloadStarted
            ? (
              <div className="flex justify-evenly items-center text-sm font-medium text-center">
                <LoadingScreen />
                <div className="p-1">

                  <span className="ml-2">
                    {totalDownload}
                  </span>
                </div>
              </div>
            )
            : (
              <table className="w-full text-left text-sm">
                {/* <div className="grid md:grid-cols-9 grid-cols-10 gap-2 text-center">
                  <div className="col-span-1" />
                  <div className="col-span-1 font-medium">Resource</div>
                  <div className="md:col-span-2 col-span-3 font-medium">Type</div>
                  <div className="col-span-3 font-medium">Organization</div>
                  <div className="col-span-2 font-medium" />
                </div> */}
                <thead>
                  <tr>
                    <th className="px-2 py-1 font-bold text-gray-700 uppercase tracking-wider w-8" />
                    <th className="px-2 py-1 font-bold text-gray-700 uppercase tracking-wider" />
                    <th className="px-2 py-1 font-bold text-gray-700 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-2 py-1 font-bold text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-2 py-1 font-bold text-gray-700 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-2 py-1 font-bold text-gray-700 uppercase tracking-wider" />
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(resourceData).map((element) => (
                    <>
                      <tr>
                        <td colSpan={6}>
                          <div className="flex items-center gap-4">
                            <input
                              type="CheckBox"
                              disabled={!(resourceData[element].length > 0)}
                              className={`${resourceData[element].length > 0 ? '' : 'bg-gray-300'}`}
                              onChange={(e) => handleCheckbox(e, { selection: 'full', id: element })}
                            />
                            <h4 className={`${resourceData[element].length > 0 ? '' : ' text-red-600'} `}>
                              {`(${element}) ${resourceData[element].length > 0 ? resourceData[element][0].language_title : 'No Content'} `}
                            </h4>
                            <div className="flex items-center gap-2 bg-red-100 text-red-600 cursor-pointer p-1 rounded-full">
                              <XMarkIcon
                                className="h-3 w-3 transform transition duration-200 hover:scale-[1.5]"
                                onClick={() => handleRemoveAccordion(element)}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>

                      {resourceData[element].length > 0 ? (
                          resourceData[element]?.map((row) => (
                            <tr className={`${row.stage === 'preprod' && 'bg-yellow-200'} hover:bg-primary hover:text-white`}>
                              <td className="w-8" />
                              <td className="px-2 py-1">
                                <input
                                  type="CheckBox"
                                  checked={row.isChecked}
                                  onChange={(e) => handleCheckbox(e, { selection: 'single', id: row.id, parent: element })}
                                />
                              </td>
                              <td className="px-2 py-1">{row.name}</td>
                              <td className="px-2 py-1">{row.subject}</td>
                              <td className="px-2 py-1">{row.owner}</td>
                              <td className="px-2 py-1">
                                {`${(row.released).split('T')[0]} (${row.release.tag_name})`}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={6}>
                            No Content Available
                          </td>
                        </tr>
                      )}
                    </>
                ))}
                </tbody>

              </table>
            )}

      <div aria-label="resources-download-filter" className="z-50 flex justify-between  p-2  ">
        <button
          className="text-xs cursor-pointer"
          type="button"
          title="download"
          onClick={handleDownload}
        >
          Download
          <ArrowDownTrayIcon
            className="w-7 h-7"
          />
        </button>

      </div>

      <SnackBar
        openSnackBar={snackBar}
        snackText={snackText}
        setOpenSnackBar={setOpenSnackBar}
        setSnackText={setSnackText}
        error={notify}
      />

    </>
  );
}

DownloadResourcePopUp.propTypes = {
  selectResource: PropTypes.string,
  isOpenDonwloadPopUp: PropTypes.bool,
  setIsOpenDonwloadPopUp: PropTypes.func,
};

export default DownloadResourcePopUp;
