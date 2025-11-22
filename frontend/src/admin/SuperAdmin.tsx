import { useEffect, useMemo, useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Clock,
  User,
  Calendar,
  Reply,
  CheckCircle2,
 
} from "lucide-react";
import axios from "axios";
import OfferManagement from "./OfferManagement";

type RoleOption = "user" | "admin" | "delivery";

const roleLabel = (u: any): RoleOption => {
  if (u.admin) return "admin";
  if (u.delivery) return "delivery";
  return "user";
};

const months = [
  { label: "Jan", value: 1 }, { label: "Feb", value: 2 }, { label: "Mar", value: 3 },
  { label: "Apr", value: 4 }, { label: "May", value: 5 }, { label: "Jun", value: 6 },
  { label: "Jul", value: 7 }, { label: "Aug", value: 8 }, { label: "Sep", value: 9 },
  { label: "Oct", value: 10 }, { label: "Nov", value: 11 }, { label: "Dec", value: 12 },
];

const SuperAdminUsers = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    checkAuthentication,
    superadminFetchUsers,
    superadminChangeRole,
    superadminFetchRestaurantMonthly,
    superadminFetchDeliveryMonthly
  } = useUserStore();

  // Users state
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  // Messages state
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const isSuperAdmin = useMemo(() => Boolean((user as any)?.superAdmin === true), [user]);

  const now = new Date();
  const [reportMonth, setReportMonth] = useState<number>(now.getMonth() + 1);
  const [reportYear, setReportYear] = useState<number>(now.getFullYear());
  const [restData, setRestData] = useState<any[]>([]);
  const [restSummary, setRestSummary] = useState<any>(null);
  const [delData, setDelData] = useState<any[]>([]);
  const [delSummary, setDelSummary] = useState<any>(null);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const loadUsers = async (opts?: { page?: number; search?: string }) => {
    setLoading(true);
    try {
      const res = await superadminFetchUsers({
        page: opts?.page ?? page,
        limit,
        search: opts?.search ?? search,
      });
      if (res) {
        setUsers(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  };

  // Messages functions
  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await axios.get(`http://localhost:3350/api/message/all?${params}`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    fetchMessages();
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const response = await axios.put(
        `http://localhost:3350/api/message/${selectedMessage._id}/reply`,
        { replyMessage: replyText },
        { withCredentials: true }
      );

      if (response.data.success) {
        setReplyText("");
        setSelectedMessage(response.data.data);
        fetchMessages(); // Refresh messages list
        toast.success("Reply sent successfully!");
      }
    } catch (error: any) {
      console.error("Error sending reply:", error);
      toast.error(error.response?.data?.message || "Failed to send reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleResolve = async (messageId: string) => {
    try {
      const response = await axios.put(
        `http://localhost:3350/api/message/${messageId}/resolve`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        setSelectedMessage(null);
        fetchMessages(); // Refresh messages list
        toast.success("Message marked as resolved!");
      }
    } catch (error: any) {
      console.error("Error resolving message:", error);
      toast.error(error.response?.data?.message || "Failed to resolve message");
    }
  };

  const loadPayments = async (m?: number, y?: number) => {
    setLoadingPayments(true);
    try {
      const month = m ?? reportMonth;
      const year = y ?? reportYear;
      const [rest, del] = await Promise.all([
        superadminFetchRestaurantMonthly({ month, year }),
        superadminFetchDeliveryMonthly({ month, year })
      ]);
      if (rest) {
        setRestData(rest.data || []);
        setRestSummary(rest.summary || null);
      }
      if (del) {
        setDelData(del.data || []);
        setDelSummary(del.summary || null);
      }
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      checkAuthentication().then(() => {});
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (!isSuperAdmin) {
        toast.error("Forbidden: SuperAdmin only");
        navigate("/");
        return;
      }
      loadUsers();
      loadPayments();
      fetchMessages();
    }
  }, [isAuthenticated, isSuperAdmin, page]);

  const onSearch = async () => {
    setPage(1);
    await loadUsers({ page: 1, search });
  };

  const onClearSearch = async () => {
    setSearch("");
    setPage(1);
    await loadUsers({ page: 1, search: "" });
  };

  const handleRoleChange = async (uid: string, role: RoleOption) => {
    await superadminChangeRole(uid, role);
    await loadUsers();
  };

  const onChangeMonth = (val: string) => setReportMonth(Number(val));
  const onChangeYear = (val: string) => setReportYear(Number(val));
  const onRefreshPayments = async () => {
    await loadPayments();
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">SuperAdmin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage users and view monthly income reports</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Manage Users</TabsTrigger>
          <TabsTrigger value="messages">Support Messages</TabsTrigger>
          <TabsTrigger value="payments">Monthly Payments</TabsTrigger>
          <TabsTrigger value="offers">Manage Offers</TabsTrigger>
        </TabsList>

        {/* ====== Manage Users Tab ====== */}
        <TabsContent value="users">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Manage Users</h2>
            <p className="text-sm text-muted-foreground">Change roles between user, admin, and delivery</p>
          </div>

          <div className="flex gap-2 items-center mb-4">
            <Input
              placeholder="Search by name, email, or contact"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Button className="bg-orange hover:bg-hoverOrange" onClick={onSearch} disabled={loading}>
              Search
            </Button>
            <Button variant="secondary" onClick={onClearSearch} disabled={loading}>
              Clear
            </Button>
          </div>

          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
                ) : users.length === 0 ? (
                  <TableRow><TableCell colSpan={6}>No users found</TableCell></TableRow>
                ) : (
                  users.map((u, idx) => {
                    const currentRole = roleLabel(u);
                    return (
                      <TableRow key={u._id || u.id || idx}>
                        <TableCell>{(page - 1) * limit + idx + 1}</TableCell>
                        <TableCell>{u.fullname}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.contact}</TableCell>
                        <TableCell className="capitalize">{currentRole}</TableCell>
                        <TableCell>
                          <Select
                            defaultValue={currentRole}
                            onValueChange={(val) => handleRoleChange(u._id || u.id, val as RoleOption)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="delivery">Delivery</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={loading || page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={loading || page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ====== Support Messages Tab ====== */}
        <TabsContent value="messages">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Support Messages</h2>
            <p className="text-sm text-muted-foreground">Manage and respond to user support messages</p>
          </div>

          {/* Messages Management */}
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1">
                <Input
                  placeholder="Search by subject, message, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchMessages} disabled={loadingMessages}>
                  {loadingMessages ? 'Loading...' : 'Search'}
                </Button>
                <Button variant="secondary" onClick={clearFilters} disabled={loadingMessages}>
                  Clear
                </Button>
              </div>
            </div>

            {/* Messages List */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No messages found</h3>
                    <p className="text-sm text-gray-500">
                      {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No support messages yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {messages.map((message) => (
                      <div key={message._id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{message.subject}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {message.message}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {message.userId.fullname}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(message.createdAt).toLocaleDateString()}
                              </div>
                              {message.adminReply && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Reply className="h-3 w-3" />
                                  Admin replied
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              message.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              message.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {message.status}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedMessage(message)}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Message Detail Modal */}
            {selectedMessage && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                  <div className="p-6 border-b">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{selectedMessage.subject}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedMessage.userId.fullname} • {selectedMessage.userId.email}
                          {selectedMessage.userId.contact && ` • ${selectedMessage.userId.contact}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedMessage.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          selectedMessage.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {selectedMessage.status}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedMessage(null)}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Original Message */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Original Message</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          Sent on {new Date(selectedMessage.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Admin Reply */}
                    {selectedMessage.adminReply && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Reply className="h-4 w-4 text-green-600" />
                          Admin Reply
                        </h4>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.adminReply.message}</p>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            Replied on {new Date(selectedMessage.adminReply.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reply Form */}
                    {selectedMessage.status !== 'resolved' && (
                      <form onSubmit={handleReply} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Add Reply
                          </label>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your reply here..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            disabled={isSubmittingReply}
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={!replyText.trim() || isSubmittingReply}
                            className="bg-orange hover:bg-orange/90"
                          >
                            {isSubmittingReply ? 'Sending...' : 'Send Reply'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleResolve(selectedMessage._id)}
                            disabled={isSubmittingReply}
                            className="bg-green hover:bg-green-90 text-green-700 border-green-300"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Mark as Resolved
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        </TabsContent>

        {/* ====== Monthly Payments Tab ====== */}
        <TabsContent value="payments">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold">Monthly Payments</h2>
              <p className="text-sm text-muted-foreground">Restaurant revenue and Delivery income</p>
            </div>
            <div className="flex gap-2">
              <Select value={String(reportMonth)} onValueChange={onChangeMonth}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(reportYear)} onValueChange={onChangeYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }).map((_, i) => {
                    const y = now.getFullYear() - 3 + i;
                    return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
              <Button className="bg-orange hover:bg-hoverOrange" onClick={onRefreshPayments} disabled={loadingPayments}>
                {loadingPayments ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Restaurant Monthly Income Table */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Restaurant Monthly Income</h3>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Total Income</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPayments ? (
                    <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
                  ) : restData.length === 0 ? (
                    <TableRow><TableCell colSpan={5}>No data</TableCell></TableRow>
                  ) : (
                    restData.map((r, idx) => (
                      <TableRow key={r.restaurantId || idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{r.restaurantname}</TableCell>
                        <TableCell>{r.city}</TableCell>
                        <TableCell className="text-right">{r.orderCount}</TableCell>
                        <TableCell className="text-right">₹{Number(r.totalIncome).toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {restSummary && (
              <div className="text-sm text-muted-foreground mt-2">
                Total Restaurants: {restSummary.restaurants} • Total Orders: {restSummary.totalOrders} • Total Income: ₹{Number(restSummary.totalIncome).toFixed(2)}
              </div>
            )}
          </div>

          {/* Delivery Monthly Income Table */}
          <div>
            <h3 className="font-semibold mb-2">Delivery Boy Monthly Income</h3>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Deliveries</TableHead>
                    <TableHead className="text-right">Total Income</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPayments ? (
                    <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
                  ) : delData.length === 0 ? (
                    <TableRow><TableCell colSpan={5}>No data</TableCell></TableRow>
                  ) : (
                    delData.map((d, idx) => (
                      <TableRow key={d.userId || idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{d.fullname}</TableCell>
                        <TableCell>{d.email}</TableCell>
                        <TableCell className="text-right">{d.deliveries}</TableCell>
                        <TableCell className="text-right">₹{Number(d.totalIncome).toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {delSummary && (
              <div className="text-sm text-muted-foreground mt-2">
                Drivers: {delSummary.drivers} • Deliveries: {delSummary.totalDeliveries} • Total Income: ₹{Number(delSummary.totalIncome).toFixed(2)}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ====== Manage Offers Tab ====== */}
        <TabsContent value="offers">
          <OfferManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminUsers;
