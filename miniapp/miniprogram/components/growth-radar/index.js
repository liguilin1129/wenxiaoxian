const {drawRadar,buildRadar} = require('../../utils/growth-radar');
Component({
  properties:{ dimensions:{type:Array,value:[],observer(){this.updateChart();}} },
  data:{ empty:true, failed:false, summary:[] },
  lifetimes:{
    ready(){this._ready=true;this.updateChart();},
    detached(){this._ready=false;this._drawVersion=(this._drawVersion||0)+1;}
  },
  pageLifetimes:{resize(){this.updateChart();}},
  methods:{
    updateChart(){
      const dimensions=this.properties.dimensions;
      const axes=buildRadar(dimensions);
      this.setData({empty:axes.every(axis=>axis.points===0), summary:axes.map(axis=>({code:axis.code,name:axis.name,points:axis.points}))});
      if(!this._ready)return;
      const version=this._drawVersion=(this._drawVersion||0)+1;
      this.createSelectorQuery().select('.growth-radar-canvas').fields({node:true,size:true}).exec(results=>{
        if(!this._ready||version!==this._drawVersion)return;
        const result=results&&results[0];
        if(!result||!result.node||!result.width||!result.height){this.setData({failed:true});return;}
        try{
          const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();
          const dpr=Math.max(1,Number(info.pixelRatio)||1);
          const canvas=result.node;
          canvas.width=Math.round(result.width*dpr); canvas.height=Math.round(result.height*dpr);
          const ctx=canvas.getContext('2d');
          ctx.scale(dpr,dpr);
          drawRadar(ctx,result.width,result.height,this.properties.dimensions);
          this.setData({failed:false});
        }catch(error){this.setData({failed:true});}
      });
    }
  }
});
