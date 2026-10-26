const store = require('../../utils/store');
Page({
  data:{signed:false,eligible:false,remaining:0,reason:'',groups:[],selectedCount:0,selectedPoints:0,submitting:false},
  onShow(){this.refresh();},
  refresh(){
    if(!store.isSigned()) return this.setData({signed:false,groups:[],selectedCount:0,selectedPoints:0});
    const status=store.getMakeupStatus();this.items=status.items;
    this.setData({signed:true,eligible:status.eligible,remaining:status.remaining,reason:status.reason});
    this.setSelection([]);
  },
  setSelection(keys){
    const chosen=new Set(keys),groups=[];this.selected=[];let points=0;
    (this.items||[]).forEach(item=>{
      let group=groups.find(entry=>entry.date===item.date);
      if(!group){group={date:item.date,items:[]};groups.push(group);}
      const checked=chosen.has(item.key);group.items.push(Object.assign({},item,{checked}));
      if(checked){this.selected.push(item.key);points+=item.points;}
    });
    this.setData({groups,selectedCount:this.selected.length,selectedPoints:points});
  },
  change(e){if(!this.data.submitting)this.setSelection(e.detail.value||[]);},
  selectAll(){if(this.data.eligible&&!this.data.submitting)this.setSelection((this.items||[]).map(item=>item.key));},
  clear(){if(!this.data.submitting)this.setSelection([]);},
  submit(){
    if(this._confirming||this.data.submitting||!this.data.selectedCount||!this.data.eligible)return;
    this._confirming=true;const keys=this.selected.slice(),signature=keys.slice().sort().join(',');
    if(!this.request||this.request.signature!==signature)this.request={id:'makeup_'+Date.now()+'_'+Math.random().toString(36).slice(2,9),signature};
    const requestId=this.request.id;
    wx.showModal({title:'确认集中补卡',content:'请仅勾选实际完成过的事项。本次补 '+keys.length+' 项，获得 '+this.data.selectedPoints+' 分，将使用 1 次免费集中补卡机会。',
      success:res=>{
        if(!res.confirm)return;this.setData({submitting:true});
        try{const batch=store.submitMakeup(keys,requestId);this.refresh();wx.showToast({title:'已补卡 '+batch.count+' 项，+'+batch.points+' 分',icon:'none'});}
        catch(error){this.refresh();wx.showToast({title:error.message,icon:'none'});}
        finally{this.setData({submitting:false});}
      },complete:()=>{this._confirming=false;}});
  },
  goLogin(){wx.navigateTo({url:'/pages/login/login'});}
});
