export function isLocalStorageAvailable(){
  try{
    const testKey = '__jute_storage_test__'
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  }catch{
    return false
  }
}
