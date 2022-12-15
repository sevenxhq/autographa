import * as logger from '../../logger';

function createData(name, language, owner) {
  return {
    name, language, owner,
  };
}
export const fetchTranslationResource = async (urlpath, setResource, selectResource, selectedPreProd) => {
  logger.debug('ResourcesPopUp.js', `fetchTranslationResource :  ${selectResource}`);
  const baseUrl = 'https://git.door43.org/api/catalog/v5/search?';
  let url = `${baseUrl}subject=${urlpath}`;
  if (selectedPreProd) {
    url += '&stage=preprod';
  }
  if (urlpath) {
    const resourceData = [];
    try {
      const fetchedData = await fetch(url);
      const fetchedJson = await fetchedData.json();
      fetchedJson.data?.forEach(async (data) => {
        const createdData = createData(data?.language_title, data?.language, data?.owner);
        createdData.responseData = data;
        resourceData.push(createdData);
      });
      if (resourceData.length === fetchedJson.data?.length) {
        setResource(resourceData);
      }
    } catch (err) {
      setOpenSnackBar(true);
      setError('failure');
      setSnackText('Load Online resource Failed. Might be due to internet');
      logger.debug('ResourcesPopUp.js', `fetchTranslationResource Error ${selectResource} :  ${err}`);
    }
  }
}