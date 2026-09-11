export const VERTEX = `#version 300 es
precision highp float;
out vec2 uv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/** Analytic, seamless surfaces. No mesh swaps, textures, or per-frame geometry. */
export const FRAGMENT = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;
uniform vec2 resolution;
uniform vec3 eye;
uniform vec3 target;
uniform float ortho;
uniform float zoom;
uniform float time;
uniform float idleTime;
uniform float progress;
uniform int sourceForm;
uniform int targetForm;
uniform float moving;

float unite(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
float ball(vec3 p, vec3 c, float r) { return length(p-c)-r; }
float ellipsoid(vec3 p, vec3 c, vec3 r) {
  vec3 q = p-c;
  float k0 = length(q/r), k1 = length(q/(r*r));
  return k0*(k0-1.0)/max(k1, 0.00001);
}
float capsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 q=p-a, v=b-a;
  return length(q-v*clamp(dot(q,v)/dot(v,v),0.0,1.0))-r;
}
float tapered(vec3 p, vec3 a, vec3 b, float ra, float rb) {
  vec3 q=p-a, v=b-a;
  float t=clamp(dot(q,v)/dot(v,v),0.0,1.0);
  return length(q-v*t)-mix(ra,rb,t);
}
float roundedBox(vec3 p, vec3 c, vec3 b, float r) {
  vec3 q=abs(p-c)-b+r;
  return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0)-r;
}
mat2 rotation(float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }

float humanoid(vec3 p, float idle) {
  // Feet stay fixed. Breathing deforms only the chest; paired limbs use abs(x).
  vec3 q=p; q.x=abs(q.x);
  float breath=0.006*sin(time*1.6)*idle;
  float pear=smoothstep(1.05,2.4,p.y);
  float torso=ellipsoid(p,vec3(0,1.68,0.025),vec3(0.60-0.14*pear+breath,0.67,0.37));
  float pelvis=ellipsoid(p,vec3(0,1.23,0),vec3(0.52,0.31,0.34));
  float d=unite(torso,pelvis,0.12);
  d=unite(d,capsule(p,vec3(0,2.23,0),vec3(0,2.57,0),0.16),0.09);
  // Very local blending preserves the spherical head and a visible narrow neck.
  d=unite(d,ball(p,vec3(0,3.02,0),0.56),0.035);
  float shoulder=tapered(q,vec3(0.35,2.13,0),vec3(0.63,2.02,0),0.19,0.17);
  float upper=tapered(q,vec3(0.63,2.02,0),vec3(0.79,1.55,0),0.17,0.145);
  float forearm=tapered(q,vec3(0.79,1.55,0),vec3(0.82,1.09,0.015),0.145,0.13);
  float hand=ellipsoid(q,vec3(0.82,1.02,0.015),vec3(0.15,0.20,0.15));
  float arm=unite(unite(shoulder,upper,0.055),unite(forearm,hand,0.055),0.035);
  d=unite(d,arm,0.12);
  float thigh=tapered(q,vec3(0.32,1.15,0),vec3(0.35,0.67,0),0.22,0.195);
  float shin=tapered(q,vec3(0.35,0.67,0),vec3(0.36,0.25,0.025),0.195,0.18);
  float foot=ellipsoid(q,vec3(0.36,0.17,0.16),vec3(0.325,0.235,0.43));
  float leg=unite(unite(thigh,shin,0.035),foot,0.12);
  return max(unite(d,leg,0.09),-p.y);
}

float car(vec3 p,float idle) {
  vec3 b=p; b.y-=0.012*sin(time*1.8)*idle;
  float d=roundedBox(b,vec3(0,0.69,0),vec3(1.27,0.35,0.59),0.23);
  d=unite(d,ellipsoid(b,vec3(-0.15,1.08,0),vec3(0.78,0.55,0.53)),0.13);
  vec3 q=p; q.x=abs(q.x); q.z=abs(q.z);
  vec2 wheelProfile=vec2(length(q.xy-vec2(0.80,0.32))-0.255,abs(q.z-0.55)-0.105);
  float wheel=length(max(wheelProfile,0.0))+min(max(wheelProfile.x,wheelProfile.y),0.0)-0.065;
  return unite(d,wheel,0.045);
}
float helicopter(vec3 p,float idle) {
  p.y-=0.10+0.035*sin(time*1.7)*idle;
  float d=ellipsoid(p,vec3(0.24,1.18,0),vec3(0.75,0.60,0.50));
  d=unite(d,capsule(p,vec3(-0.25,1.22,0),vec3(-1.45,1.47,0),0.13),0.19);
  d=unite(d,ellipsoid(p,vec3(-1.45,1.57,0),vec3(0.17,0.34,0.08)),0.07);
  vec3 q=p; q.z=abs(q.z);
  float skid=capsule(q,vec3(-0.62,0.12,0.47),vec3(0.84,0.12,0.47),0.075);
  float supports=min(capsule(q,vec3(-0.30,0.65,0.28),vec3(-0.30,0.17,0.47),0.06),
    capsule(q,vec3(0.53,0.65,0.28),vec3(0.53,0.17,0.47),0.06));
  d=unite(d,unite(skid,supports,0.07),0.08);
  d=unite(d,capsule(p,vec3(0.15,1.65,0),vec3(0.15,1.99,0),0.075),0.05);
  q=p-vec3(0.15,1.98,0); q.xz=rotation(idleTime*5.0*moving)*q.xz;
  float rotor=min(roundedBox(q,vec3(0),vec3(1.45,0.035,0.10),0.03),
    roundedBox(q,vec3(0),vec3(0.10,0.035,1.45),0.03));
  d=unite(d,rotor,0.06);
  q=p-vec3(-1.47,1.57,0.12); q.xy=rotation(idleTime*7.0*moving)*q.xy;
  float tailRotor=min(roundedBox(q,vec3(0),vec3(0.30,0.04,0.035),0.025),
    roundedBox(q,vec3(0),vec3(0.04,0.30,0.035),0.025));
  return unite(d,tailRotor,0.04);
}
float puppy(vec3 p,float idle) {
  float d=ellipsoid(p,vec3(-0.19,0.90,0),vec3(0.78,0.43+0.008*sin(time*2.0)*idle,0.39));
  vec3 h=p-vec3(0.65,1.43,0); h.xy=rotation(0.025*sin(time*0.8)*idle)*h.xy;
  float head=ball(h,vec3(0),0.46);
  head=unite(head,ellipsoid(h,vec3(0.33,-0.12,0),vec3(0.30,0.22,0.28)),0.10);
  vec3 ear=h; ear.z=abs(ear.z);
  head=unite(head,ellipsoid(ear,vec3(-0.09,-0.12,0.39),vec3(0.22,0.39,0.14)),0.07);
  d=unite(d,head,0.13);
  vec3 q=p; q.z=abs(q.z);
  float legs=min(capsule(q,vec3(-0.66,0.78,0.27),vec3(-0.70,0.17,0.31),0.16),
    capsule(q,vec3(0.40,0.78,0.27),vec3(0.46,0.17,0.31),0.16));
  float feet=min(ellipsoid(q,vec3(-0.65,0.13,0.31),vec3(0.23,0.17,0.19)),
    ellipsoid(q,vec3(0.51,0.13,0.31),vec3(0.23,0.17,0.19)));
  d=unite(d,unite(legs,feet,0.08),0.10);
  d=unite(d,capsule(p,vec3(-0.77,1.0,0),vec3(-1.13,1.43,0.07*sin(time*3.0)*idle),0.115),0.12);
  return max(d,-p.y);
}
float building(vec3 p,float idle) {
  float d=roundedBox(p,vec3(0,0.13,0),vec3(0.88,0.13,0.68),0.10);
  d=unite(d,roundedBox(p,vec3(-0.12,1.49,0),vec3(0.57,1.30,0.46),0.14),0.07);
  d=unite(d,roundedBox(p,vec3(0.50,0.78,0.02),vec3(0.27,0.56,0.43),0.11),0.08);
  float floors=abs(mod(p.y-0.32,0.36)-0.18)-0.025;
  float shell=roundedBox(p,vec3(-0.12,1.49,0),vec3(0.584,1.18,0.474),0.10);
  return unite(d,max(shell,floors),0.025);
}
float tree(vec3 p,float idle) {
  float d=capsule(p,vec3(0,0.17,0),vec3(0,1.90,0),0.21);
  vec3 q=p; q.x=abs(q.x); q.z=abs(q.z);
  d=unite(d,capsule(q,vec3(0,0.20,0),vec3(0.57,0.075,0.36),0.10),0.12);
  d=unite(d,capsule(q,vec3(0,1.18,0),vec3(0.61,2.02,0),0.14),0.13);
  vec3 c=p; c.x-=0.015*sin(time*1.3)*idle*smoothstep(1.4,2.9,p.y);
  float canopy=ball(c,vec3(0,2.60,0),0.67);
  canopy=unite(canopy,ball(c,vec3(-0.61,2.22,0.04),0.56),0.19);
  canopy=unite(canopy,ball(c,vec3(0.60,2.28,0.02),0.58),0.19);
  canopy=unite(canopy,ball(c,vec3(0.03,2.13,0.35),0.53),0.19);
  return max(unite(d,canopy,0.12),-p.y);
}
vec3 phoneSpace(vec3 p,float idle) {
  p-=vec3(0,1.70+0.025*sin(time*1.4)*idle,0);
  p.xz=rotation(0.12*sin(time*0.5)*idle)*p.xz;
  return p;
}
float phone(vec3 p,float idle) {
  vec3 q=phoneSpace(p,idle);
  float d=roundedBox(q,vec3(0),vec3(0.64,1.20,0.115),0.105);
  // Camera impressions on the rear, formed from the same surface.
  d=unite(d,roundedBox(q,vec3(-0.35,0.88,-0.12),vec3(0.17,0.19,0.035),0.06),0.025);
  return d;
}
float form(vec3 p,int f,float idle) {
  if(f==0) return humanoid(p,idle);
  if(f==1) return car(p,idle);
  if(f==2) return helicopter(p,idle);
  if(f==3) return puppy(p,idle);
  if(f==4) return building(p,idle);
  if(f==5) return tree(p,idle);
  return phone(p,idle);
}

float scene(vec3 p) {
  if(progress>=1.0) return form(p,targetForm,moving);
  vec3 center=vec3(0,1.57,0);
  vec3 q=p-center;
  float liquid=length(q/vec3(0.85,0.92,0.85))-1.0;
  liquid*=0.85;
  liquid+=0.022*sin(q.x*7.0+time*2.0)*sin(q.y*6.0-time*2.7)*sin(q.z*7.0+time);
  // A shared analytic field becomes exactly the same mass on both sides of
  // the midpoint. Incompatible topologies never need vertex correspondence.
  if(progress<0.46) {
    float melt=smoothstep(0.06,0.41,progress);
    float anticipation=0.055*sin(clamp(progress/0.20,0.0,1.0)*3.14159)*(1.0-melt);
    vec3 s=p; s.y/=1.0-anticipation; s.xz/=1.0+anticipation*0.5;
    return mix(form(s,sourceForm,moving*(1.0-smoothstep(0.0,0.14,progress))),liquid,melt);
  }
  float reform=smoothstep(0.54,0.91,progress);
  float settle=progress>0.88 ? 0.022*sin((progress-0.88)/0.12*6.28318)*(1.0-progress)/0.12 : 0.0;
  vec3 s=p; s.y/=1.0+settle;
  return mix(liquid,form(s,targetForm,moving*smoothstep(0.88,1.0,progress)),reform);
}
vec3 normalAt(vec3 p) {
  vec2 e=vec2(0.0015,-0.0015);
  return normalize(e.xyy*scene(p+e.xyy)+e.yyx*scene(p+e.yyx)+e.yxy*scene(p+e.yxy)+e.xxx*scene(p+e.xxx));
}
float occlusion(vec3 p,vec3 n) {
  float ao=0.0;
  for(int i=1;i<=3;i++) { float h=float(i)*0.09; ao+=(h-scene(p+n*h))/float(i); }
  return clamp(1.0-ao*1.25,0.65,1.0);
}
vec3 surface(vec3 p,vec3 n,vec3 view) {
  vec3 key=normalize(vec3(0.7,0.9,0.8));
  float warm=max(0.0,dot(n,key));
  float cyan=max(0.0,dot(n,normalize(vec3(-1.0,0.25,0.45))));
  float lower=exp(-max(p.y,0.0)*1.9);
  float rim=pow(1.0-max(dot(n,view),0.0),2.5);
  vec3 col=vec3(0.63,0.57,0.76);
  col=mix(col,vec3(1.0,0.84,0.72),warm*0.85);
  col=mix(col,vec3(0.47,0.88,0.90),cyan*0.75);
  col=mix(col,vec3(0.97,0.59,0.34),lower*(0.3+0.4*max(-n.y,0.0)));
  col+=vec3(0.10,0.09,0.12)*rim;
  col+=0.065*pow(max(dot(n,normalize(key+view)),0.0),14.0);
  col*=occlusion(p,n);
  // Shallow impressions, shaded in the shared palette, never pasted textures.
  int materialForm=progress<0.46 ? sourceForm : targetForm;
  float detail=progress<0.46 ? 1.0-smoothstep(0.06,0.41,progress) : smoothstep(0.75,1.0,progress);
  if(materialForm==1) {
    float window=smoothstep(1.00,1.10,p.y)*(1.0-smoothstep(1.45,1.53,p.y));
    window*=smoothstep(0.30,0.39,abs(p.z))*(1.0-smoothstep(0.58,0.69,abs(p.x+0.15)));
    col=mix(col,vec3(0.47,0.67,0.75),window*0.65*detail);
    float lights=smoothstep(1.13,1.20,abs(p.x))*(1.0-smoothstep(0.07,0.13,abs(p.y-0.75)));
    col+=vec3(0.16,0.10,0.06)*lights*detail;
    float hub=1.0-smoothstep(0.115,0.145,length(vec2(abs(p.x)-0.80,p.y-0.32)));
    col=mix(col,vec3(0.69,0.67,0.80),hub*smoothstep(0.68,0.71,abs(p.z))*detail*0.55);
  }
  if(materialForm==2) {
    float glass=smoothstep(0.45,0.65,p.x)*smoothstep(1.12,1.25,p.y);
    col=mix(col,vec3(0.46,0.70,0.78),glass*detail*0.6);
  }
  if(materialForm==4) {
    vec2 cell=vec2(mod(p.x+0.12,0.25)-0.125,mod(p.y-0.13,0.36)-0.18);
    float windows=(1.0-smoothstep(0.045,0.065,abs(cell.x)))*(1.0-smoothstep(0.065,0.085,abs(cell.y)));
    windows*=smoothstep(0.35,0.45,abs(p.z))*smoothstep(0.35,0.45,p.y)*(1.0-smoothstep(2.55,2.7,p.y));
    col=mix(col,vec3(0.52,0.74,0.80)+0.025*sin(p.y*3.0-time*moving),windows*detail*0.8);
  }
  if(materialForm==6) {
    float idle=progress<0.46 ? 1.0-smoothstep(0.0,0.14,progress) : smoothstep(0.88,1.0,progress);
    vec3 q=phoneSpace(p,moving*idle);
    float screen=1.0-smoothstep(-0.015,0.008,roundedBox(q,vec3(0,0,0.12),vec3(0.56,1.11,0.04),0.075));
    vec3 glass=mix(vec3(0.39,0.57,0.71),vec3(0.78,0.70,0.87),clamp(q.y*0.35+0.5,0.0,1.0));
    glass+=0.03*sin(time*1.3)*moving;
    col=mix(col,glass,screen*detail*0.85);
    float lens=min(length(q.xy-vec2(-0.35,0.96)),length(q.xy-vec2(-0.35,0.80)));
    col*=1.0-0.25*(1.0-smoothstep(0.04,0.06,lens))*step(q.z,-0.12)*detail;
  }
  return col;
}
void main() {
  vec2 screen=uv*2.0-1.0; screen.x*=resolution.x/resolution.y;
  vec3 forward=normalize(target-eye);
  vec3 right=normalize(cross(forward,vec3(0,1,0)));
  vec3 up=cross(right,forward);
  vec3 ro=eye;
  vec3 rd=normalize(forward+0.30*(right*screen.x+up*screen.y));
  if(ortho>0.5) { ro+=zoom*0.30*(right*screen.x+up*screen.y); rd=forward; }
  vec3 col=mix(vec3(0.935,0.935,0.93),vec3(0.974,0.962,0.947),uv.y);
  // Project the actual world floor, so shadows stay grounded through orbit.
  float groundT=rd.y<-0.0001 ? -ro.y/rd.y : 100.0;
  if(groundT>0.0 && groundT<60.0) {
    vec3 floorP=ro+rd*groundT;
    float shadow=exp(-dot(floorP.xz/vec2(1.05,0.68),floorP.xz/vec2(1.05,0.68))*2.0);
    float contact=0.0;
    if(targetForm==0 && progress>=1.0) {
      vec2 a=floorP.xz-vec2(0.36,0.16), b=floorP.xz-vec2(-0.36,0.16);
      contact=exp(-dot(a/vec2(0.32,0.42),a/vec2(0.32,0.42))*2.0)+exp(-dot(b/vec2(0.32,0.42),b/vec2(0.32,0.42))*2.0);
    }
    col-=vec3(0.105,0.10,0.10)*shadow+vec3(0.08)*contact;
  }
  vec3 offset=ro-vec3(0,1.75,0);
  float b=dot(offset,rd), c=dot(offset,offset)-2.35*2.35;
  float disc=b*b-c;
  if(disc>0.0) {
    float root=sqrt(disc), t=max(0.0,-b-root), end=-b+root;
    bool hit=false; vec3 p;
    for(int i=0;i<112;i++) {
      p=ro+rd*t;
      float d=scene(p);
      if(d<0.0015) { hit=true; break; }
      t+=max(d*0.72,0.0007);
      if(t>end || (groundT>0.0 && t>groundT+0.005)) break;
    }
    if(hit) col=surface(p,normalAt(p),-rd);
  }
  float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
  color=vec4(col+(grain-0.5)/255.0,1.0);
}`;
