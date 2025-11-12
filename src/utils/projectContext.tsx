import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Project } from '../types/database';

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: React.Dispatch<React.SetStateAction<Project | null>>;
  loadProject: (projectId: number) => Promise<void>;
  clearProject: () => void;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearProject = useCallback(() => {
    setCurrentProject(null);
    localStorage.removeItem('currentProjectId');
  }, []);

  const loadProject = useCallback(async (projectId: number) => {
    try {
      setLoading(true);
      console.log(`[ProjectContext] Proje yükleme başlıyor... Proje ID: ${projectId}`);

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error(`[ProjectContext] Proje yükleme hatası:`, error);
        throw error;
      }

      console.log(`[ProjectContext] Proje başarıyla yüklendi:`, data);
      setCurrentProject(data);

      // localStorage'a project ID'yi kaydet
      localStorage.setItem('currentProjectId', projectId.toString());
      console.log(`[ProjectContext] ProjectID localStorage'a kaydedildi: ${projectId}`);
    } catch (error) {
      console.error('[ProjectContext] Proje yükleme hatası:', error);
      clearProject(); // Hata durumunda mevcut projeyi temizle
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [clearProject, navigate]);

  useEffect(() => {
    // Uygulama başladığında localStorage'dan proje ID'sini al
    const projectId = localStorage.getItem('currentProjectId');
    if (projectId) {
      loadProject(parseInt(projectId));
    } else {
      setLoading(false);
    }
  }, [loadProject]);

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        setCurrentProject,
        loadProject,
        clearProject,
        loading
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}; 