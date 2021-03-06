import create from '../../../../libs/create'
import store from '../../store/index'

create.Component(store, {
  use: [
    'userInfo'
  ],
  data: {
    name: 'gene'
  },
  methods: {
    onInputNameChange: function(e) {
      const { value } = e.detail
      this.store.data.userInfo.name = value
    },
    onInputSexChange: function(e) {
      const { value } = e.detail
      this.store.data.userInfo.sex = value
      this.store.data.logs.push(value)
    }
  }
  
});
