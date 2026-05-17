import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowClockwiseIcon,
  CaretLeftIcon,
  CaretRightIcon,
  DotsThreeIcon,
  GithubLogoIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import {
  type ColumnDef,
  type ColumnSizingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import * as DropdownMenuComponent from "~/components/ui/dropdown-menu";
import * as FieldComponent from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import * as SheetComponent from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import * as TableComponent from "~/components/ui/table";
import {
  type IAgent,
  useTriggerAgentScan,
} from "~/hooks/http/agents/agents.http";
import { zGithubRepository } from "~/infrastructure/validation/atoms/github.atom";
import { cn } from "~/lib/utils";

const zCreateAgentForm = z.object({ repository: zGithubRepository });
type ICreateAgentForm = z.infer<typeof zCreateAgentForm>;

type AgentColumnMeta = {
  className?: string;
  headerLabel?: string;
  sticky?: boolean;
  skeleton?: { type?: "text" | "badge" | "icon"; width?: string };
};

type TableScrollState = {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  isScrollable: boolean;
};

type AgentsTableMeta = {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  scrollLeft: () => void;
  scrollRight: () => void;
};

interface AgentsTableProps {
  organizationId: string;
  agents: IAgent[];
  total: number;
  limit: number;
  offset: number;
  isLoading?: boolean;
  onPageChange: (offset: number) => void;
  onScanStarted?: () => void;
}

const loadingSkeletonRows = Array.from({ length: 7 }, (_, index) => index);

const statusStyles = {
  PENDING: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  COMPLETED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  FAILED: "border-red-400/20 bg-red-400/10 text-red-300",
} as const;

const statusLabels = {
  PENDING: "scanning",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

const classificationStyles = {
  AGENT: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  POSSIBLE_AGENT: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  NOT_AGENT: "border-zinc-400/20 bg-zinc-400/10 text-zinc-300",
} as const;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const getRepositoryPath = (repositoryLink: string) => {
  try {
    const url = new URL(repositoryLink);
    return url.pathname.replace(/^\/+/, "").replace(/\.git$/, "");
  } catch {
    return repositoryLink;
  }
};

const getInitials = (name: string) =>
  name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.at(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "--";

function RepositoryCell({ agent }: { agent: IAgent }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex size-7 shrink-0 items-center justify-center border bg-muted font-semibold text-[10px] text-muted-foreground">
        {getInitials(agent.repoName)}
      </span>
      <div className="min-w-0">
        <div className="truncate font-semibold">{agent.repoName}</div>
        <div className="truncate text-[11px] text-muted-foreground">
          {agent.repoId}
        </div>
      </div>
    </div>
  );
}

function RepositoryLinkCell({ repositoryLink }: { repositoryLink: string }) {
  return (
    <a
      href={repositoryLink}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-1.5 px-0! text-primary",
        buttonVariants({ variant: "link" }),
      )}
      onClick={(event) => event.stopPropagation()}
    >
      <GithubLogoIcon className="shrink-0" weight="duotone" />
      <span className="truncate">{getRepositoryPath(repositoryLink)}</span>
    </a>
  );
}

function ActionsCell({
  agent,
  onTriggerScan,
}: {
  agent: IAgent;
  onTriggerScan: (repository: string) => void;
}) {
  return (
    <div className="flex w-full items-center justify-center">
      <DropdownMenuComponent.DropdownMenu>
        <DropdownMenuComponent.DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="size-8"
            onClick={(event) => event.stopPropagation()}
          >
            <DotsThreeIcon weight="bold" />
            <span className="sr-only">Open agent actions</span>
          </Button>
        </DropdownMenuComponent.DropdownMenuTrigger>
        <DropdownMenuComponent.DropdownMenuContent align="end" className="w-44">
          <DropdownMenuComponent.DropdownMenuItem
            onSelect={() => onTriggerScan(agent.repoLink)}
          >
            <ArrowClockwiseIcon weight="duotone" />
            Trigger scan
          </DropdownMenuComponent.DropdownMenuItem>
        </DropdownMenuComponent.DropdownMenuContent>
      </DropdownMenuComponent.DropdownMenu>
    </div>
  );
}

function getColumns({
  onTriggerScan,
}: {
  onTriggerScan: (repository: string) => void;
}): ColumnDef<IAgent>[] {
  return [
    {
      id: "repoName",
      accessorKey: "repoName",
      header: "Repository",
      size: 280,
      minSize: 240,
      maxSize: 420,
      enableResizing: true,
      meta: {
        sticky: true,
        headerLabel: "Repository",
        skeleton: { type: "text", width: "w-36" },
        className:
          "w-[280px] min-w-[240px] bg-background md:sticky md:left-0 z-20",
      },
      cell: ({ row }) => <RepositoryCell agent={row.original} />,
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      size: 150,
      minSize: 130,
      maxSize: 200,
      enableResizing: true,
      meta: { headerLabel: "Status", skeleton: { type: "badge" } },
      cell: ({ row }) => (
        <Badge variant="outline" className={statusStyles[row.original.status]}>
          {row.original.status === "PENDING" ? (
            <SpinnerIcon className="size-3 animate-spin" />
          ) : null}
          {statusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      id: "classification",
      accessorKey: "classification",
      header: "Classification",
      size: 190,
      minSize: 160,
      maxSize: 260,
      enableResizing: true,
      meta: { headerLabel: "Classification", skeleton: { type: "badge" } },
      cell: ({ row }) =>
        row.original.classification ? (
          <Badge
            variant="outline"
            className={classificationStyles[row.original.classification]}
          >
            {row.original.classification.replaceAll("_", " ").toLowerCase()}
          </Badge>
        ) : (
          <span className="text-muted-foreground">Pending</span>
        ),
    },
    {
      id: "agentName",
      accessorKey: "agentName",
      header: "Agent Name",
      size: 220,
      minSize: 180,
      maxSize: 320,
      enableResizing: true,
      meta: {
        headerLabel: "Agent Name",
        skeleton: { type: "text", width: "w-32" },
      },
      cell: ({ row }) => row.original.agentName ?? "-",
    },
    {
      id: "confidence",
      accessorKey: "confidence",
      header: "Confidence",
      size: 150,
      minSize: 130,
      maxSize: 200,
      enableResizing: true,
      meta: { headerLabel: "Confidence", skeleton: { type: "badge" } },
      cell: ({ row }) => (
        <span className="text-muted-foreground capitalize">
          {row.original.confidence ?? "Pending"}
        </span>
      ),
    },
    {
      id: "frameworksDetected",
      accessorKey: "frameworksDetected",
      header: "Frameworks",
      size: 260,
      minSize: 200,
      maxSize: 420,
      enableResizing: true,
      meta: {
        headerLabel: "Frameworks",
        skeleton: { type: "text", width: "w-36" },
      },
      cell: ({ row }) => (
        <span className="block truncate text-muted-foreground">
          {row.original.frameworksDetected.length > 0
            ? row.original.frameworksDetected.join(", ")
            : "-"}
        </span>
      ),
    },
    {
      id: "repoLink",
      accessorKey: "repoLink",
      header: "Link",
      size: 260,
      minSize: 220,
      maxSize: 420,
      enableResizing: true,
      meta: { headerLabel: "Link", skeleton: { type: "text", width: "w-40" } },
      cell: ({ row }) => (
        <RepositoryLinkCell repositoryLink={row.original.repoLink} />
      ),
    },
    {
      id: "updatedAt",
      accessorKey: "updatedAt",
      header: "Updated",
      size: 190,
      minSize: 170,
      maxSize: 240,
      enableResizing: true,
      meta: {
        headerLabel: "Updated",
        skeleton: { type: "text", width: "w-28" },
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.updatedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 96,
      minSize: 96,
      maxSize: 96,
      enableResizing: false,
      enableSorting: false,
      enableHiding: false,
      meta: {
        sticky: true,
        headerLabel: "Actions",
        skeleton: { type: "icon" },
        className:
          "sticky right-0 z-30 justify-center bg-background text-center",
      },
      cell: ({ row }) => (
        <ActionsCell agent={row.original} onTriggerScan={onTriggerScan} />
      ),
    },
  ];
}

export function AgentsTable({
  organizationId,
  agents,
  total,
  limit,
  offset,
  isLoading = false,
  onPageChange,
  onScanStarted,
}: AgentsTableProps) {
  const tableRootRef = useRef<HTMLDivElement | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<IAgent | null>(null);
  const [tableScrollState, setTableScrollState] = useState<TableScrollState>({
    canScrollLeft: false,
    canScrollRight: false,
    isScrollable: false,
  });
  const { isPending: isTriggeringScan, mutateAsync: triggerScan } =
    useTriggerAgentScan();

  const handleTriggerScan = useCallback(
    async (repository: string) => {
      await triggerScan({ organizationId, repository });
      toast.success("Repository scan started");
      onScanStarted?.();
    },
    [onScanStarted, organizationId, triggerScan],
  );

  const columns = useMemo(
    () => getColumns({ onTriggerScan: handleTriggerScan }),
    [handleTriggerScan],
  );

  const updateTableScrollState = useCallback(() => {
    const tableContainer = tableContainerRef.current;
    if (!tableContainer) return;

    const maxScrollLeft =
      tableContainer.scrollWidth - tableContainer.clientWidth;
    const next = {
      canScrollLeft: tableContainer.scrollLeft > 0,
      canScrollRight: tableContainer.scrollLeft < maxScrollLeft - 1,
      isScrollable: maxScrollLeft > 1,
    };

    setTableScrollState((previous) =>
      previous.canScrollLeft === next.canScrollLeft &&
      previous.canScrollRight === next.canScrollRight &&
      previous.isScrollable === next.isScrollable
        ? previous
        : next,
    );
  }, []);

  const scrollTableLeft = useCallback(() => {
    tableContainerRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  }, []);

  const scrollTableRight = useCallback(() => {
    tableContainerRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  }, []);

  const tableMeta = useMemo<AgentsTableMeta>(
    () => ({
      canScrollLeft: tableScrollState.canScrollLeft,
      canScrollRight: tableScrollState.canScrollRight,
      scrollLeft: scrollTableLeft,
      scrollRight: scrollTableRight,
    }),
    [scrollTableLeft, scrollTableRight, tableScrollState],
  );

  const table = useReactTable<IAgent>({
    data: agents,
    getRowId: (row) => row.id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onColumnSizingChange: setColumnSizing,
    onGlobalFilterChange: setGlobalFilter,
    state: { columnSizing, globalFilter },
    meta: tableMeta,
  });

  useEffect(() => {
    const tableRoot = tableRootRef.current;
    if (!tableRoot) return;

    const tableContainer = tableRoot.querySelector<HTMLDivElement>(
      "[data-slot='table-container']",
    );
    if (!tableContainer) return;

    tableContainerRef.current = tableContainer;
    tableContainer.classList.add("no-scrollbar");
    updateTableScrollState();
    tableContainer.addEventListener("scroll", updateTableScrollState, {
      passive: true,
    });

    const resizeObserver = new ResizeObserver(updateTableScrollState);
    resizeObserver.observe(tableContainer);
    const tableElement = tableContainer.querySelector("table");
    if (tableElement) resizeObserver.observe(tableElement);

    return () => {
      tableContainer.classList.remove("no-scrollbar");
      tableContainer.removeEventListener("scroll", updateTableScrollState);
      resizeObserver.disconnect();
      if (tableContainerRef.current === tableContainer)
        tableContainerRef.current = null;
    };
  }, [updateTableScrollState]);

  const visibleColumns = table.getVisibleLeafColumns();
  const tableRows = table.getRowModel().rows;
  const canPrevious = offset > 0;
  const canNext = offset + limit < total;
  const currentPage = Math.floor(offset / limit) + 1;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const currentTableMeta = table.options.meta as AgentsTableMeta | undefined;

  const renderLoadingCell = (
    column: (typeof visibleColumns)[number],
    rowIndex: number,
  ) => {
    const columnMeta = column.columnDef.meta as AgentColumnMeta | undefined;
    const skeletonType = columnMeta?.skeleton?.type ?? "text";
    const skeletonWidth = columnMeta?.skeleton?.width ?? "w-24";

    if (column.id === "repoName") {
      return (
        <div className="flex items-center gap-2">
          <Skeleton className="size-7" />
          <Skeleton
            className={cn("h-4", rowIndex % 2 === 0 ? "w-28" : "w-36")}
          />
        </div>
      );
    }

    if (skeletonType === "badge") return <Skeleton className="h-5 w-24" />;
    if (skeletonType === "icon") return <Skeleton className="size-7" />;
    return <Skeleton className={cn("h-3.5", skeletonWidth)} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-96">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Search agents or repositories"
            className="pl-8"
          />
        </div>
        <CreateAgentButton
          isPending={isTriggeringScan}
          onCreate={handleTriggerScan}
        />
      </div>

      <div ref={tableRootRef} className="overflow-hidden border bg-background">
        <TableComponent.Table
          className="w-max min-w-full"
          style={{ width: table.getTotalSize() }}
        >
          <TableComponent.TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableComponent.TableRow
                key={headerGroup.id}
                className="hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => {
                  const columnMeta = header.column.columnDef.meta as
                    | AgentColumnMeta
                    | undefined;
                  const showHorizontalScrollButtons =
                    header.column.id === "repoName" &&
                    tableScrollState.isScrollable &&
                    Boolean(currentTableMeta);

                  return (
                    <TableComponent.TableHead
                      key={header.id}
                      className={cn(
                        "group/header relative border-x text-muted-foreground first:border-l-0 last:border-r-0",
                        header.column.id === "repoName" &&
                          "border-border! border-r! after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border after:content-['']",
                        header.column.id === "actions" &&
                          "border-border! border-l! before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border before:content-['']",
                        columnMeta?.className,
                      )}
                      style={{
                        width: header.getSize(),
                        minWidth:
                          header.column.columnDef.minSize ?? header.getSize(),
                        maxWidth: header.column.columnDef.maxSize,
                      }}
                    >
                      {header.isPlaceholder ? null : showHorizontalScrollButtons &&
                        currentTableMeta ? (
                        <div className="flex items-center justify-between gap-2 overflow-hidden">
                          <div className="min-w-0 truncate">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </div>
                          <div className="hidden items-center gap-1 md:flex">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              disabled={!currentTableMeta.canScrollLeft}
                              onClick={currentTableMeta.scrollLeft}
                            >
                              <CaretLeftIcon />
                              <span className="sr-only">Scroll table left</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              disabled={!currentTableMeta.canScrollRight}
                              onClick={currentTableMeta.scrollRight}
                            >
                              <CaretRightIcon />
                              <span className="sr-only">
                                Scroll table right
                              </span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}

                      {header.column.getCanResize() && (
                        <button
                          type="button"
                          aria-label={`Resize ${columnMeta?.headerLabel ?? header.column.id} column`}
                          onDoubleClick={() => header.column.resetSize()}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onClick={(event) => event.preventDefault()}
                          className={cn(
                            "absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none bg-transparent transition-colors hover:bg-border/80 group-hover/header:bg-border/40",
                            header.column.getIsResizing() && "bg-border",
                          )}
                        />
                      )}
                    </TableComponent.TableHead>
                  );
                })}
              </TableComponent.TableRow>
            ))}
          </TableComponent.TableHeader>
          <TableComponent.TableBody>
            {tableRows.map((row) => (
              <TableComponent.TableRow
                key={row.id}
                className="group h-12 cursor-pointer bg-background transition-none hover:bg-muted/40"
                onClick={() => setSelectedAgent(row.original)}
              >
                {row.getVisibleCells().map((cell) => {
                  const columnMeta = cell.column.columnDef.meta as
                    | AgentColumnMeta
                    | undefined;

                  return (
                    <TableComponent.TableCell
                      key={cell.id}
                      className={cn(
                        "border-x first:border-l-0 last:border-r-0",
                        cell.column.id === "repoName" &&
                          "relative border-border! border-r! border-l-0! after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border after:content-['']",
                        cell.column.id === "actions" &&
                          "relative border-border! border-l! border-r-0! before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border before:content-['']",
                        columnMeta?.className,
                        columnMeta?.sticky && "cursor-pointer bg-background",
                      )}
                      style={{
                        width: cell.column.getSize(),
                        minWidth:
                          cell.column.columnDef.minSize ??
                          cell.column.getSize(),
                        maxWidth: cell.column.columnDef.maxSize,
                      }}
                      onClick={
                        cell.column.id === "actions"
                          ? (event) => event.stopPropagation()
                          : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableComponent.TableCell>
                  );
                })}
              </TableComponent.TableRow>
            ))}
          </TableComponent.TableBody>
        </TableComponent.Table>

        {isLoading ? (
          <div className="border-t">
            {loadingSkeletonRows.map((rowIndex) => (
              <div
                className="flex h-12 border-b last:border-b-0"
                key={`agents-loading-${rowIndex}`}
                style={{ width: table.getTotalSize() }}
              >
                {visibleColumns.map((column) => {
                  const columnMeta = column.columnDef.meta as
                    | AgentColumnMeta
                    | undefined;
                  return (
                    <div
                      key={`agents-loading-${rowIndex}-${column.id}`}
                      className={cn(
                        "flex items-center border-x bg-background px-3 first:border-l-0 last:border-r-0",
                        columnMeta?.className,
                      )}
                      style={{
                        width: column.getSize(),
                        minWidth: column.columnDef.minSize ?? column.getSize(),
                        maxWidth: column.columnDef.maxSize,
                      }}
                    >
                      {renderLoadingCell(column, rowIndex)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : tableRows.length === 0 ? (
          <div className="border-t p-8 text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center border bg-muted">
              <GithubLogoIcon weight="duotone" />
            </div>
            <h2 className="font-medium">No agents found</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Start a repository scan to populate this table.
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {total === 0 ? 0 : offset + 1}-
          {Math.min(offset + limit, total)} of {total}
        </span>
        <div className="flex items-center gap-2">
          <span>
            Page {currentPage} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!canPrevious}
            onClick={() => onPageChange(Math.max(0, offset - limit))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => onPageChange(offset + limit)}
          >
            Next
          </Button>
        </div>
      </div>

      <AgentDetailsSheet
        agent={selectedAgent}
        onOpenChange={(open) => !open && setSelectedAgent(null)}
      />
    </div>
  );
}

function CreateAgentButton({
  isPending,
  onCreate,
}: {
  isPending: boolean;
  onCreate: (repository: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<ICreateAgentForm>({
    resolver: zodResolver(zCreateAgentForm),
    defaultValues: { repository: "" },
    mode: "onChange",
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) form.reset();
  }

  async function handleSubmit(data: ICreateAgentForm) {
    await onCreate(data.repository);
    handleOpenChange(false);
  }

  return (
    <SheetComponent.Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetComponent.SheetTrigger asChild>
        <Button type="button" size="lg">
          Add agent
          <PlusIcon />
        </Button>
      </SheetComponent.SheetTrigger>
      <SheetComponent.SheetContent>
        <SheetComponent.SheetHeader>
          <SheetComponent.SheetTitle>Add agent</SheetComponent.SheetTitle>
          <SheetComponent.SheetDescription>
            Submit a GitHub repository URL to trigger a worker scan.
          </SheetComponent.SheetDescription>
        </SheetComponent.SheetHeader>

        <form
          id="create-agent-form"
          className="flex flex-1 flex-col"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <div className="px-4 py-2">
            <FieldComponent.FieldGroup>
              <Controller
                control={form.control}
                name="repository"
                render={({ field, fieldState }) => (
                  <FieldComponent.Field data-invalid={fieldState.invalid}>
                    <FieldComponent.FieldLabel htmlFor="create-agent-repository">
                      GitHub repository URL
                    </FieldComponent.FieldLabel>
                    <Input
                      {...field}
                      id="create-agent-repository"
                      aria-invalid={fieldState.invalid}
                      placeholder="https://github.com/owner/repository"
                      autoComplete="off"
                    />
                    <FieldComponent.FieldDescription>
                      The scan appears immediately as scanning while the worker
                      analyzes it.
                    </FieldComponent.FieldDescription>
                    {fieldState.invalid && (
                      <FieldComponent.FieldError errors={[fieldState.error]} />
                    )}
                  </FieldComponent.Field>
                )}
              />
            </FieldComponent.FieldGroup>
          </div>

          <SheetComponent.SheetFooter className="grid grid-cols-2">
            <Button
              type="submit"
              form="create-agent-form"
              disabled={
                !form.formState.isValid ||
                form.formState.isSubmitting ||
                isPending
              }
            >
              {isPending ? <SpinnerIcon className="animate-spin" /> : null}
              Start scan
            </Button>
            <SheetComponent.SheetClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </SheetComponent.SheetClose>
          </SheetComponent.SheetFooter>
        </form>
      </SheetComponent.SheetContent>
    </SheetComponent.Sheet>
  );
}

function AgentDetailsSheet({
  agent,
  onOpenChange,
}: {
  agent: IAgent | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <SheetComponent.Sheet open={Boolean(agent)} onOpenChange={onOpenChange}>
      <SheetComponent.SheetContent className="sm:max-w-2xl">
        {agent ? (
          <>
            <SheetComponent.SheetHeader>
              <SheetComponent.SheetTitle>
                {agent.agentName ?? agent.repoName}
              </SheetComponent.SheetTitle>
              <SheetComponent.SheetDescription>
                {agent.repoId}
              </SheetComponent.SheetDescription>
            </SheetComponent.SheetHeader>
            <div className="space-y-6 overflow-y-auto px-4 py-2">
              <div className="grid grid-cols-3 gap-2">
                <DetailStat label="Status" value={agent.status} />
                <DetailStat
                  label="Classification"
                  value={agent.classification ?? "Pending"}
                />
                <DetailStat
                  label="Confidence"
                  value={agent.confidence ?? "Pending"}
                />
              </div>

              <section className="space-y-2">
                <h3 className="font-medium">Reasoning</h3>
                <p className="text-muted-foreground text-sm leading-6">
                  {agent.reasoning ?? "Analysis is still running."}
                </p>
              </section>

              <DetailList title="Agent signals" items={agent.agentSignals} />
              <DetailList title="Evidence files" items={agent.evidenceFiles} />
              <DetailList title="Frameworks" items={agent.frameworksDetected} />
              <DetailList
                title="Tools"
                items={agent.agentAccessRights?.tools ?? []}
              />
              <DetailList
                title="APIs"
                items={agent.agentAccessRights?.apis ?? []}
              />
            </div>
          </>
        ) : null}
      </SheetComponent.SheetContent>
    </SheetComponent.Sheet>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border bg-muted/30 p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 truncate font-medium text-sm capitalize">
        {value.replaceAll("_", " ").toLowerCase()}
      </p>
    </div>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="space-y-2">
      <h3 className="font-medium">{title}</h3>
      {items.length > 0 ? (
        <ul className="list-disc space-y-1 pl-4 text-muted-foreground text-sm">
          {items.map((item) => (
            <li key={item} className="break-words">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">No data reported.</p>
      )}
    </section>
  );
}
