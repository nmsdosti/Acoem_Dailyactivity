import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, UserCheck, UserX, Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";

interface Engineer {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  role: string;
  weekly_hour_requirement: number;
  is_active: boolean;
  created_at?: string;
}

interface EngineerFormData {
  employee_id: string;
  full_name: string;
  email: string;
  role: string;
  weekly_hour_requirement: number;
  is_active: boolean;
}

interface EngineerManagementProps {
  engineers: Engineer[];
  onEngineersChange: () => void;
}

export function EngineerManagement({ engineers, onEngineersChange }: EngineerManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<Engineer | null>(null);
  const [formData, setFormData] = useState<EngineerFormData>({
    employee_id: '',
    full_name: '',
    email: '',
    role: 'engineer',
    weekly_hour_requirement: 40,
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      employee_id: '',
      full_name: '',
      email: '',
      role: 'engineer',
      weekly_hour_requirement: 40,
      is_active: true
    });
    setEditingEngineer(null);
  };

  const openDialog = (engineer?: Engineer) => {
    if (engineer) {
      setEditingEngineer(engineer);
      setFormData({
        employee_id: engineer.employee_id,
        full_name: engineer.full_name,
        email: engineer.email,
        role: engineer.role || 'engineer',
        weekly_hour_requirement: engineer.weekly_hour_requirement,
        is_active: engineer.is_active
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingEngineer) {
        // Update existing engineer
        const { error } = await supabase
          .from('engineers')
          .update({
            employee_id: formData.employee_id,
            full_name: formData.full_name,
            email: formData.email,
            role: formData.role,
            weekly_hour_requirement: formData.weekly_hour_requirement,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEngineer.id);

        if (error) throw error;
        toast({ title: "Success", description: "Engineer updated successfully!" });
      } else {
        // Create new engineer
        const { error } = await supabase
          .from('engineers')
          .insert({
            employee_id: formData.employee_id,
            full_name: formData.full_name,
            email: formData.email,
            role: formData.role,
            weekly_hour_requirement: formData.weekly_hour_requirement,
            is_active: formData.is_active
          });

        if (error) throw error;
        toast({ title: "Success", description: "Engineer created successfully!" });
      }

      onEngineersChange();
      closeDialog();
    } catch (error: any) {
      console.error('Error saving engineer:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save engineer", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (engineer: Engineer) => {
    if (!confirm(`Are you sure you want to delete ${engineer.full_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('engineers')
        .delete()
        .eq('id', engineer.id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Engineer deleted successfully!" });
      onEngineersChange();
    } catch (error: any) {
      console.error('Error deleting engineer:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete engineer", 
        variant: "destructive" 
      });
    }
  };

  const toggleEngineerStatus = async (engineer: Engineer) => {
    try {
      const { error } = await supabase
        .from('engineers')
        .update({ 
          is_active: !engineer.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', engineer.id);

      if (error) throw error;
      
      toast({ 
        title: "Success", 
        description: `Engineer ${engineer.is_active ? 'deactivated' : 'activated'} successfully!` 
      });
      onEngineersChange();
    } catch (error: any) {
      console.error('Error updating engineer status:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update engineer status", 
        variant: "destructive" 
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
      limited_admin: { label: 'Limited Admin', color: 'bg-blue-100 text-blue-800' },
      engineer: { label: 'Engineer', color: 'bg-gray-100 text-gray-800' }
    };
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.engineer;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Engineer Management</CardTitle>
              <CardDescription>
                Manage engineer accounts, roles, and settings
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openDialog()} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Engineer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingEngineer ? 'Edit Engineer' : 'Add New Engineer'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingEngineer 
                      ? 'Update engineer information and settings.'
                      : 'Create a new engineer account with access to the activity tracker.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee_id">Employee ID</Label>
                      <Input
                        id="employee_id"
                        value={formData.employee_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                        placeholder="ENG001"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weekly_hours">Weekly Hours</Label>
                      <Input
                        id="weekly_hours"
                        type="number"
                        min="1"
                        max="80"
                        value={formData.weekly_hour_requirement}
                        onChange={(e) => setFormData(prev => ({ ...prev, weekly_hour_requirement: parseInt(e.target.value) || 40 }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john.doe@company.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engineer">Engineer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="limited_admin">Limited Admin (View Only)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {formData.role === 'admin' && 'Full access to all features'}
                      {formData.role === 'limited_admin' && 'Can view data but cannot delete or modify user status'}
                      {formData.role === 'engineer' && 'Can only log their own activities'}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Active Engineer</Label>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={closeDialog}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : editingEngineer ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Weekly Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engineers.map((engineer) => (
                  <TableRow key={engineer.id}>
                    <TableCell className="font-medium">
                      {engineer.employee_id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {engineer.is_active ? (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <UserX className="h-4 w-4 text-red-600" />
                        )}
                        {engineer.full_name}
                      </div>
                    </TableCell>
                    <TableCell>{engineer.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {(engineer.role === 'admin' || engineer.role === 'limited_admin') && (
                          <Shield className="h-4 w-4 text-purple-600" />
                        )}
                        {getRoleBadge(engineer.role)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {engineer.weekly_hour_requirement}h/week
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={engineer.is_active ? "default" : "secondary"}>
                        {engineer.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(engineer.created_at || '').toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openDialog(engineer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleEngineerStatus(engineer)}
                        >
                          {engineer.is_active ? (
                            <UserX className="h-4 w-4 text-red-600" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(engineer)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {engineers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No engineers found. Add your first engineer to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}