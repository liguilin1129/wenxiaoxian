const AXES = [['DE','德育'],['INT','智育'],['PE','体育'],['ART','美育'],['LAB','劳育']];
function buildRadar(dimensions) {
  return AXES.map(([code,name],index) => {
    const item = (dimensions || []).find(dim => dim.code === code) || {};
    const points = Number.isFinite(Number(item.points)) ? Number(item.points) : 0;
    const score = Number.isFinite(Number(item.score)) ? Math.max(0,Math.min(100,Number(item.score))) : 0;
    const angle = -Math.PI/2 + index*Math.PI*2/5;
    return {code,name,points,score,angle,
      x:160+Math.cos(angle)*score, y:162+Math.sin(angle)*score,
      labelX:160+Math.cos(angle)*132, labelY:162+Math.sin(angle)*132};
  });
}
function drawRadar(ctx,width,height,dimensions) {
  const axes=buildRadar(dimensions);
  const scale=Math.min(width,height)/320;
  ctx.clearRect(0,0,width,height);
  ctx.save();
  ctx.translate((width-320*scale)/2,(height-320*scale)/2);
  ctx.scale(scale,scale);
  // Circular base and four grid rings; five data axes remain independent.
  ctx.beginPath(); ctx.arc(160,162,100,0,Math.PI*2);
  ctx.fillStyle='#F5F3FF'; ctx.fill();
  ctx.strokeStyle='#DDD9F1'; ctx.lineWidth=1;
  [25,50,75,100].forEach(radius=>{
    ctx.beginPath(); ctx.arc(160,162,radius,0,Math.PI*2); ctx.stroke();
  });
  axes.forEach(axis=>{
    ctx.beginPath(); ctx.moveTo(160,162);
    ctx.lineTo(160+Math.cos(axis.angle)*100,162+Math.sin(axis.angle)*100); ctx.stroke();
  });
  ctx.beginPath();
  axes.forEach((axis,index)=>{ if(index)ctx.lineTo(axis.x,axis.y);else ctx.moveTo(axis.x,axis.y); });
  ctx.closePath(); ctx.fillStyle='rgba(94,92,230,0.22)'; ctx.fill();
  ctx.strokeStyle='#5E5CE6'; ctx.lineWidth=2; ctx.stroke();
  axes.forEach(axis=>{
    ctx.beginPath(); ctx.arc(axis.x,axis.y,3,0,Math.PI*2); ctx.fillStyle='#5E5CE6'; ctx.fill();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='600 14px sans-serif'; ctx.fillStyle='#39344F';
    ctx.fillText(axis.name,axis.labelX,axis.labelY-5);
    ctx.font='12px sans-serif'; ctx.fillStyle='#78738D';
    ctx.fillText(axis.points+' 分',axis.labelX,axis.labelY+13);
  });
  ctx.restore();
}
module.exports={buildRadar,drawRadar};
