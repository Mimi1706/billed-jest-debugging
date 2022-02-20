export const localStorageMock = (function() {
  let store = {};
  return {
    // Récupère 
    getItem: function(key) {
      return JSON.stringify(store[key])
    },
    // Modifie
    setItem: function(key, value) {
      store[key] = value.toString()
    },
    clear: function() {
      store = {}
    },
    removeItem: function(key) {
      delete store[key]
    }
  }
})()