#version 430

in vec3 f_vertexInView;
in vec3 f_normalInView;

out vec4 fragColor;

struct LightInfo{
	vec4 position;
	vec4 spotDirection;
	vec4 La;			// Ambient light intensity
	vec4 Ld;			// Diffuse light intensity
	vec4 Ls;			// Specular light intensity
	float spotExponent;
	float spotCutoff;
	float constantAttenuation;
	float linearAttenuation;
	float quadraticAttenuation;
};

struct MaterialInfo
{
	vec4 Ka;
	vec4 Kd;
	vec4 Ks;
	float shininess;
};

uniform int lightIdx;			// Use this variable to contrl lighting mode
uniform mat4 um4v;				// Camera viewing transformation matrix
uniform LightInfo light[3];
uniform MaterialInfo material;

vec4 directionalLight(vec3 N, vec3 V){

	vec4 lightInView = um4v * light[0].position;	// the position of the light in camera space
	vec3 S = normalize(lightInView.xyz);			// Normalized lightInView
	vec3 H = normalize(S + V);						// Half vector

	// [TODO] calculate diffuse coefficient and specular coefficient here

	vec3 pos = lightInView.xyz - f_vertexInView;
	vec3 L = normalize(pos);

	float dc = max(dot(N, L), 0);	
	float sc = pow(max(dot(N, H), 0), 64);
	vec4 ans = light[0].La * material.Ka + dc * light[0].Ld * material.Kd + sc * light[0].Ls * material.Ks;
	
	return ans;
}

vec4 pointLight(vec3 N, vec3 V){

	vec4 lightInView = um4v * light[1].position;	
	vec3 S = normalize(lightInView.xyz);			
	vec3 H = normalize(S + V);						

	vec3 pos = lightInView.xyz - f_vertexInView;
	vec3 L = normalize(pos);
	float distance = length(L);
	float cal = light[1].constantAttenuation + light[1].linearAttenuation * distance + light[1].quadraticAttenuation * distance * distance;
	float factor = 1 / cal;

	float dc = max(dot(N, L), 0);	
	float sc = pow(max(dot(N, H), 0), 64);
	vec4 ans = light[1].La * material.Ka + dc * factor * light[1].Ld * material.Kd + sc * factor * light[1].Ls * material.Ks;
	return ans;
}

vec4 spotLight(vec3 N, vec3 V){
	

	vec4 lightInView = um4v * light[2].position;	
	vec3 S = normalize(lightInView.xyz);			
	vec3 H = normalize(S + V);

	vec3 pos = lightInView.xyz - f_vertexInView;
	vec3 L = normalize(pos);
	float distance = length(L);
	float cal = light[2].constantAttenuation + light[2].linearAttenuation * distance + light[2].quadraticAttenuation * distance * distance;
	float factor = 1 / cal;

	float effect = 0.0;
	
	//vec3 S1 = normalize(-um4v * light[2].spotDirection).xyz;
	//float a = dot(L, normalize(S.xyz));
	
	vec3 direction = normalize((transpose(inverse(um4v)) * light[2].spotDirection).xyz);
	float calculate = dot(-L, direction);

	if(light[2].spotCutoff <= degrees(acos(calculate)))
	{
		float dc = max(dot(N, L), 0);	
		float sc = pow(max(dot(N, H), 0), 64);
		vec4 ans = light[2].La * material.Ka + dc * factor * effect * light[2].Ld * material.Kd + sc * factor * effect * light[2].Ls * material.Ks;
		return ans;
	}
	else
	{
		float dc = max(dot(N, L), 0);	
		float sc = pow(max(dot(N, H), 0), 64);
		effect = pow(max(calculate, 0), light[2].spotExponent);
		vec4 ans = light[2].La * material.Ka + dc * factor * effect * light[2].Ld * material.Kd + sc * factor * effect * light[2].Ls * material.Ks;
		return ans;
	}
}

void main() {

	vec3 N = normalize(f_normalInView);		// N represents normalized normal of the model in camera space
	vec3 V = normalize(-f_vertexInView);	// V represents the vector from the vertex of the model to the camera position
	
	vec4 color = vec4(0, 0, 0, 0);

	// Handle lighting mode
	if(lightIdx == 0)
	{
		color += directionalLight(N, V);
	}
	else if(lightIdx == 1)
	{
		color += pointLight(N, V);
	}
	else if(lightIdx == 2)
	{
		color += spotLight(N ,V);
	}

	fragColor = color;
}
