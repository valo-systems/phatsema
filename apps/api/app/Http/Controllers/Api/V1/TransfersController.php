<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Transfers\TransferCommandService;
use App\Application\Transfers\TransferPresenter;
use App\Application\Transfers\TransferQueryService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Transfers\CancelTransferRequest;
use App\Http\Requests\Transfers\CreateTransferRequest;
use App\Http\Requests\Transfers\DispatchTransferRequest;
use App\Http\Requests\Transfers\ReceiveTransferRequest;
use App\Http\Requests\Transfers\TransitionTransferRequest;
use App\Http\Requests\Transfers\UpdateTransferRequest;
use App\Http\Resources\TransferResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TransfersController extends Controller
{
    public function __construct(
        private readonly TransferQueryService $queries,
        private readonly TransferCommandService $commands,
        private readonly TransferPresenter $presenter,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $page = max(1, $request->integer('page', 1));
        $pageSize = min(100, max(1, $request->integer('pageSize', 25)));
        $result = $this->queries->search([
            'status' => $request->query('status'),
            'siteId' => $request->query('siteId'),
            'page' => $page,
            'pageSize' => $pageSize,
        ]);

        return response()->json([
            'data' => $this->presenter->presentMany($result['records']),
            'meta' => [
                'page' => $page,
                'pageSize' => $pageSize,
                'total' => $result['total'],
                'sort' => null,
            ],
        ]);
    }

    public function show(string $transferId): TransferResource
    {
        return $this->resource($this->queries->get($transferId));
    }

    public function store(CreateTransferRequest $request): JsonResponse
    {
        return $this->resource($this->commands->create($request->validated()))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateTransferRequest $request, string $transferId): TransferResource
    {
        return $this->resource($this->commands->update($transferId, $request->validated()));
    }

    public function submit(TransitionTransferRequest $request, string $transferId): TransferResource
    {
        return $this->resource($this->commands->submit($transferId, $request->integer('version')));
    }

    public function approve(TransitionTransferRequest $request, string $transferId): TransferResource
    {
        return $this->resource($this->commands->approve($transferId, $request->integer('version')));
    }

    public function dispatch(DispatchTransferRequest $request, string $transferId): TransferResource
    {
        return $this->resource($this->commands->dispatch($transferId, $request->validated()));
    }

    public function receive(ReceiveTransferRequest $request, string $transferId): TransferResource
    {
        return $this->resource($this->commands->receive($transferId, $request->validated()));
    }

    public function cancel(CancelTransferRequest $request, string $transferId): TransferResource
    {
        return $this->resource($this->commands->cancel(
            $transferId,
            $request->integer('version'),
            $request->string('reason')->toString(),
        ));
    }

    /** @param array<string, mixed> $transfer */
    private function resource(array $transfer): TransferResource
    {
        return new TransferResource($this->presenter->present($transfer));
    }
}
