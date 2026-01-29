import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  Plus, 
  Trash2,
  User,
  FileText,
  Wrench,
  Briefcase,
  Code,
  GraduationCap,
  Award
} from 'lucide-react';

interface ResumeData {
  header: {
    name: string;
    title: string;
    contact: {
      email: string;
      phone: string;
      location: string;
      linkedin?: string;
    };
  };
  summary: string;
  skills: {
    technical: string[];
    tools: string[];
    domain: string[];
  };
  work_experience: Array<{
    title: string;
    company: string;
    duration: string;
    location: string;
    achievements: string[];
  }>;
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
    highlights: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    year: string;
  }>;
}

interface SectionVisibility {
  personalDetails: boolean;
  summary: boolean;
  skills: boolean;
  experience: boolean;
  projects: boolean;
  education: boolean;
  certifications: boolean;
}

interface ResumeEditorPanelProps {
  resumeData: ResumeData;
  onUpdate: (data: ResumeData) => void;
  visibility: SectionVisibility;
  onVisibilityChange: (section: keyof SectionVisibility) => void;
}

const SectionHeader = ({ 
  icon: Icon, 
  title, 
  isVisible, 
  onToggleVisibility,
  isOpen 
}: { 
  icon: any; 
  title: string; 
  isVisible: boolean;
  onToggleVisibility: () => void;
  isOpen: boolean;
}) => (
  <div className="flex items-center gap-3 w-full py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors">
    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
    <Icon className="w-4 h-4 text-muted-foreground" />
    <span className="flex-1 font-medium text-left">{title}</span>
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8"
      onClick={(e) => {
        e.stopPropagation();
        onToggleVisibility();
      }}
    >
      {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
    </Button>
    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
  </div>
);

export const ResumeEditorPanel = ({ 
  resumeData, 
  onUpdate, 
  visibility, 
  onVisibilityChange 
}: ResumeEditorPanelProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personalDetails: false,
    summary: false,
    skills: false,
    experience: false,
    projects: false,
    education: false,
    certifications: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateHeader = (field: string, value: string) => {
    const newData = { ...resumeData };
    if (field.startsWith('contact.')) {
      const contactField = field.replace('contact.', '') as keyof typeof resumeData.header.contact;
      newData.header.contact = { ...newData.header.contact, [contactField]: value };
    } else {
      (newData.header as any)[field] = value;
    }
    onUpdate(newData);
  };

  const updateSummary = (value: string) => {
    onUpdate({ ...resumeData, summary: value });
  };

  const updateSkills = (category: 'technical' | 'tools' | 'domain', skills: string[]) => {
    onUpdate({ 
      ...resumeData, 
      skills: { ...resumeData.skills, [category]: skills } 
    });
  };

  const addSkill = (category: 'technical' | 'tools' | 'domain') => {
    const newSkills = [...resumeData.skills[category], 'New Skill'];
    updateSkills(category, newSkills);
  };

  const removeSkill = (category: 'technical' | 'tools' | 'domain', index: number) => {
    const newSkills = resumeData.skills[category].filter((_, i) => i !== index);
    updateSkills(category, newSkills);
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const newExperience = [...resumeData.work_experience];
    (newExperience[index] as any)[field] = value;
    onUpdate({ ...resumeData, work_experience: newExperience });
  };

  const addExperience = () => {
    onUpdate({
      ...resumeData,
      work_experience: [...resumeData.work_experience, {
        title: 'Job Title',
        company: 'Company Name',
        duration: '2024 - Present',
        location: 'Location',
        achievements: ['Achievement 1']
      }]
    });
  };

  const removeExperience = (index: number) => {
    onUpdate({
      ...resumeData,
      work_experience: resumeData.work_experience.filter((_, i) => i !== index)
    });
  };

  const addAchievement = (expIndex: number) => {
    const newExperience = [...resumeData.work_experience];
    newExperience[expIndex].achievements.push('New achievement');
    onUpdate({ ...resumeData, work_experience: newExperience });
  };

  const updateProject = (index: number, field: string, value: any) => {
    const newProjects = [...resumeData.projects];
    (newProjects[index] as any)[field] = value;
    onUpdate({ ...resumeData, projects: newProjects });
  };

  const addProject = () => {
    onUpdate({
      ...resumeData,
      projects: [...resumeData.projects, {
        title: 'Project Name',
        description: 'Project description',
        technologies: ['Tech 1'],
        highlights: []
      }]
    });
  };

  const removeProject = (index: number) => {
    onUpdate({
      ...resumeData,
      projects: resumeData.projects.filter((_, i) => i !== index)
    });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const newEducation = [...resumeData.education];
    (newEducation[index] as any)[field] = value;
    onUpdate({ ...resumeData, education: newEducation });
  };

  const addEducation = () => {
    onUpdate({
      ...resumeData,
      education: [...resumeData.education, {
        degree: 'Degree Name',
        institution: 'Institution',
        year: '2024'
      }]
    });
  };

  const removeEducation = (index: number) => {
    onUpdate({
      ...resumeData,
      education: resumeData.education.filter((_, i) => i !== index)
    });
  };

  const updateCertification = (index: number, field: string, value: string) => {
    const newCerts = [...resumeData.certifications];
    (newCerts[index] as any)[field] = value;
    onUpdate({ ...resumeData, certifications: newCerts });
  };

  const addCertification = () => {
    onUpdate({
      ...resumeData,
      certifications: [...resumeData.certifications, {
        name: 'Certification Name',
        issuer: 'Issuer',
        year: '2024'
      }]
    });
  };

  const removeCertification = (index: number) => {
    onUpdate({
      ...resumeData,
      certifications: resumeData.certifications.filter((_, i) => i !== index)
    });
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-2">
        {/* Personal Details */}
        <Collapsible open={openSections.personalDetails} onOpenChange={() => toggleSection('personalDetails')}>
          <CollapsibleTrigger asChild>
            <button className="w-full">
              <SectionHeader 
                icon={User} 
                title="Personal Details" 
                isVisible={visibility.personalDetails}
                onToggleVisibility={() => onVisibilityChange('personalDetails')}
                isOpen={openSections.personalDetails}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 py-3 space-y-3">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input 
                value={resumeData.header.name} 
                onChange={(e) => updateHeader('name', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input 
                value={resumeData.header.title} 
                onChange={(e) => updateHeader('title', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input 
                value={resumeData.header.contact.email} 
                onChange={(e) => updateHeader('contact.email', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input 
                value={resumeData.header.contact.phone} 
                onChange={(e) => updateHeader('contact.phone', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input 
                value={resumeData.header.contact.location} 
                onChange={(e) => updateHeader('contact.location', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">LinkedIn</label>
              <Input 
                value={resumeData.header.contact.linkedin || ''} 
                onChange={(e) => updateHeader('contact.linkedin', e.target.value)}
                className="mt-1"
                placeholder="linkedin.com/in/username"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Professional Summary */}
        <Collapsible open={openSections.summary} onOpenChange={() => toggleSection('summary')}>
          <CollapsibleTrigger asChild>
            <button className="w-full">
              <SectionHeader 
                icon={FileText} 
                title="Professional Summary" 
                isVisible={visibility.summary}
                onToggleVisibility={() => onVisibilityChange('summary')}
                isOpen={openSections.summary}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 py-3">
            <Textarea 
              value={resumeData.summary} 
              onChange={(e) => updateSummary(e.target.value)}
              className="min-h-32"
              placeholder="Write a compelling professional summary..."
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Skills */}
        <Collapsible open={openSections.skills} onOpenChange={() => toggleSection('skills')}>
          <CollapsibleTrigger asChild>
            <button className="w-full">
              <SectionHeader 
                icon={Wrench} 
                title="Skills" 
                isVisible={visibility.skills}
                onToggleVisibility={() => onVisibilityChange('skills')}
                isOpen={openSections.skills}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 py-3 space-y-4">
            {(['technical', 'tools', 'domain'] as const).map((category) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium capitalize">{category}</label>
                  <Button variant="ghost" size="sm" onClick={() => addSkill(category)}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills[category].map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                      <Input 
                        value={skill}
                        onChange={(e) => {
                          const newSkills = [...resumeData.skills[category]];
                          newSkills[idx] = e.target.value;
                          updateSkills(category, newSkills);
                        }}
                        className="h-5 w-auto min-w-16 border-none bg-transparent p-0 text-xs focus-visible:ring-0"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 hover:bg-destructive/20"
                        onClick={() => removeSkill(category, idx)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Experience */}
        <Collapsible open={openSections.experience} onOpenChange={() => toggleSection('experience')}>
          <CollapsibleTrigger asChild>
            <button className="w-full">
              <SectionHeader 
                icon={Briefcase} 
                title="Experience" 
                isVisible={visibility.experience}
                onToggleVisibility={() => onVisibilityChange('experience')}
                isOpen={openSections.experience}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 py-3 space-y-4">
            {resumeData.work_experience.map((exp, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">Position {idx + 1}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeExperience(idx)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Input 
                  value={exp.title} 
                  onChange={(e) => updateExperience(idx, 'title', e.target.value)}
                  placeholder="Job Title"
                />
                <Input 
                  value={exp.company} 
                  onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                  placeholder="Company"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    value={exp.duration} 
                    onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                    placeholder="Duration"
                  />
                  <Input 
                    value={exp.location} 
                    onChange={(e) => updateExperience(idx, 'location', e.target.value)}
                    placeholder="Location"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground">Achievements</label>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => addAchievement(idx)}>
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  {exp.achievements.map((ach, achIdx) => (
                    <div key={achIdx} className="flex gap-1 mb-1">
                      <Input 
                        value={ach}
                        onChange={(e) => {
                          const newAch = [...exp.achievements];
                          newAch[achIdx] = e.target.value;
                          updateExperience(idx, 'achievements', newAch);
                        }}
                        className="text-xs"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 shrink-0"
                        onClick={() => {
                          const newAch = exp.achievements.filter((_, i) => i !== achIdx);
                          updateExperience(idx, 'achievements', newAch);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={addExperience}>
              <Plus className="w-4 h-4 mr-2" /> Add Experience
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Projects */}
        <Collapsible open={openSections.projects} onOpenChange={() => toggleSection('projects')}>
          <CollapsibleTrigger asChild>
            <button className="w-full">
              <SectionHeader 
                icon={Code} 
                title="Projects" 
                isVisible={visibility.projects}
                onToggleVisibility={() => onVisibilityChange('projects')}
                isOpen={openSections.projects}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 py-3 space-y-4">
            {resumeData.projects.map((proj, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">Project {idx + 1}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeProject(idx)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Input 
                  value={proj.title} 
                  onChange={(e) => updateProject(idx, 'title', e.target.value)}
                  placeholder="Project Title"
                />
                <Textarea 
                  value={proj.description} 
                  onChange={(e) => updateProject(idx, 'description', e.target.value)}
                  placeholder="Description"
                  className="min-h-16"
                />
                <div>
                  <label className="text-xs text-muted-foreground">Technologies (comma-separated)</label>
                  <Input 
                    value={proj.technologies.join(', ')} 
                    onChange={(e) => updateProject(idx, 'technologies', e.target.value.split(',').map(t => t.trim()))}
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={addProject}>
              <Plus className="w-4 h-4 mr-2" /> Add Project
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Education */}
        <Collapsible open={openSections.education} onOpenChange={() => toggleSection('education')}>
          <CollapsibleTrigger asChild>
            <button className="w-full">
              <SectionHeader 
                icon={GraduationCap} 
                title="Education" 
                isVisible={visibility.education}
                onToggleVisibility={() => onVisibilityChange('education')}
                isOpen={openSections.education}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 py-3 space-y-4">
            {resumeData.education.map((edu, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">Education {idx + 1}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeEducation(idx)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Input 
                  value={edu.degree} 
                  onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                  placeholder="Degree"
                />
                <Input 
                  value={edu.institution} 
                  onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                  placeholder="Institution"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    value={edu.year} 
                    onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                    placeholder="Year"
                  />
                  <Input 
                    value={edu.gpa || ''} 
                    onChange={(e) => updateEducation(idx, 'gpa', e.target.value)}
                    placeholder="GPA (optional)"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={addEducation}>
              <Plus className="w-4 h-4 mr-2" /> Add Education
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Certifications */}
        <Collapsible open={openSections.certifications} onOpenChange={() => toggleSection('certifications')}>
          <CollapsibleTrigger asChild>
            <button className="w-full">
              <SectionHeader 
                icon={Award} 
                title="Certifications" 
                isVisible={visibility.certifications}
                onToggleVisibility={() => onVisibilityChange('certifications')}
                isOpen={openSections.certifications}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 py-3 space-y-4">
            {resumeData.certifications.map((cert, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">Certification {idx + 1}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeCertification(idx)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Input 
                  value={cert.name} 
                  onChange={(e) => updateCertification(idx, 'name', e.target.value)}
                  placeholder="Certification Name"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    value={cert.issuer} 
                    onChange={(e) => updateCertification(idx, 'issuer', e.target.value)}
                    placeholder="Issuer"
                  />
                  <Input 
                    value={cert.year} 
                    onChange={(e) => updateCertification(idx, 'year', e.target.value)}
                    placeholder="Year"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={addCertification}>
              <Plus className="w-4 h-4 mr-2" /> Add Certification
            </Button>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default ResumeEditorPanel;
